import { scrapeTikToks } from "./apify";
import { uploadVideo, analyzeVideo } from "./gemini";
import { generateConcepts } from "./claude";
import { readCreators, readConfigs, appendVideos } from "./csv";
import { ApifyTikTokResult, TikTokVideo, PipelineProgress } from "./types";
import crypto from "crypto";

interface PipelineOptions {
  configName: string;
  maxVideos: number;
  topK: number;
  daysLookback: number;
}

type ProgressCallback = (progress: PipelineProgress) => void;

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + " MB";
  if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + " KB";
  return bytes + " B";
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function elapsed(start: number): string {
  const s = ((Date.now() - start) / 1000).toFixed(1);
  return `${s}s`;
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

export async function runPipeline(
  options: PipelineOptions,
  onProgress: ProgressCallback
) {
  const pipelineStart = Date.now();

  const configs = readConfigs();
  const config = configs.find((c) => c.configName === options.configName);
  if (!config) throw new Error(`Config "${options.configName}" not found`);

  const allCreators = readCreators();
  const creators = allCreators.filter(
    (c) => c.category === config.creatorsCategory
  );
  if (creators.length === 0) {
    throw new Error(`No creators in category "${config.creatorsCategory}"`);
  }

  const progress: PipelineProgress = {
    phase: "scraping",
    creatorsProcessed: 0,
    creatorsTotal: creators.length,
    videosProcessed: 0,
    videosTotal: 0,
    activeTasks: [],
    errors: [],
    log: [],
  };

  const log = (msg: string) => {
    progress.log.push(msg);
    onProgress({ ...progress, log: [...progress.log] });
  };

  // ── Phase 1: Scraping ──
  log(`── PHASE 1: SCRAPING ──`);
  log(`Config: ${config.configName} | Category: ${config.creatorsCategory}`);
  log(`Settings: ${options.maxVideos} max videos, top ${options.topK}, last ${options.daysLookback} days`);
  log(`Found ${creators.length} creators: ${creators.map((c) => "@" + c.username).join(", ")}`);
  log(``);

  const allScrapedVideos: { creator: string; videos: ApifyTikTokResult[] }[] = [];

  for (const creator of creators) {
    const scrapeStart = Date.now();
    try {
      progress.activeTasks = [creator.username];
      onProgress({ ...progress });
      log(`Scraping @${creator.username}...`);

      const videos = await scrapeTikToks(
        creator.username,
        options.maxVideos,
        options.daysLookback
      );

      const sorted = videos.sort((a, b) => b.playCount - a.playCount);
      const topVideos = sorted.slice(0, options.topK);

      allScrapedVideos.push({ creator: creator.username, videos: topVideos });

      if (topVideos.length > 0) {
        const topPlays = topVideos.map((v) => formatCount(v.playCount)).join(", ");
        log(`  Found ${videos.length} videos, selected top ${topVideos.length} (${topPlays} plays) [${elapsed(scrapeStart)}]`);
      } else {
        log(`  No videos found in last ${options.daysLookback} days [${elapsed(scrapeStart)}]`);
      }
    } catch (err) {
      const msg = `Error scraping @${creator.username}: ${err instanceof Error ? err.message : err}`;
      progress.errors.push(msg);
      log(`  ${msg}`);
    }
    progress.creatorsProcessed++;
    progress.activeTasks = [];
    onProgress({ ...progress });
  }

  const totalScraped = allScrapedVideos.reduce((n, s) => n + s.videos.length, 0);
  log(``);
  log(`Scraping complete: ${totalScraped} videos from ${allScrapedVideos.length} creators`);

  if (totalScraped === 0) {
    progress.phase = "done";
    progress.activeTasks = [];
    log(`No videos to analyze. Pipeline finished.`);
    onProgress({ ...progress });
    return;
  }

  // ── Phase 2: Analysis ──
  log(``);
  log(`── PHASE 2: ANALYZE & GENERATE ──`);
  const videosToAnalyze = allScrapedVideos.flatMap((s) =>
    s.videos.map((v) => ({ creator: s.creator, video: v }))
  );
  progress.phase = "analyzing";
  progress.videosTotal = videosToAnalyze.length;
  log(`Processing ${videosToAnalyze.length} videos (1 at a time to avoid rate limits)`);
  log(``);
  onProgress({ ...progress });

  const analyzedVideos: TikTokVideo[] = [];

  const tasks = videosToAnalyze.map(
    ({ creator, video }, idx) =>
      async () => {
        const num = idx + 1;
        const label = `@${creator}`;
        const shortId = String(video.id).slice(-8);
        const prefix = `[${num}/${videosToAnalyze.length}] ${label}`;
        progress.activeTasks = [...progress.activeTasks, `${label} - ${shortId}`];
        onProgress({ ...progress });

        const videoStart = Date.now();

        try {
          // Download
          const downloadUrl = video.videoMeta.downloadAddr;
          if (!downloadUrl) throw new Error("No download URL available");
          log(`${prefix} Downloading video ...${shortId}`);
          const videoRes = await fetch(downloadUrl, { signal: AbortSignal.timeout(120_000) });
          if (!videoRes.ok) throw new Error(`Download failed (${videoRes.status})`);
          const buffer = Buffer.from(await videoRes.arrayBuffer());
          if (buffer.length < 1000) throw new Error(`Download too small (${buffer.length} bytes) — likely an error`);
          log(`${prefix} Downloaded ${formatBytes(buffer.length)} [${elapsed(videoStart)}]`);

          // Upload to Gemini
          const uploadStart = Date.now();
          log(`${prefix} Uploading to Gemini...`);
          const { uri, mimeType } = await uploadVideo(
            buffer,
            `${creator}-${video.id}.mp4`
          );
          log(`${prefix} Upload complete, processing... [${elapsed(uploadStart)}]`);

          // Analyze
          const analyzeStart = Date.now();
          log(`${prefix} Analyzing with Gemini 2.5 Flash...`);
          const analysis = await analyzeVideo(
            uri,
            mimeType,
            config.analysisInstruction
          );
          log(`${prefix} Analysis complete (${analysis.length} chars) [${elapsed(analyzeStart)}]`);

          // Generate concepts
          const conceptStart = Date.now();
          log(`${prefix} Generating concepts with Claude...`);
          const concepts = await generateConcepts(
            analysis,
            config.newConceptsInstruction
          );
          log(`${prefix} Concepts generated (${concepts.length} chars) [${elapsed(conceptStart)}]`);

          const tiktokVideo: TikTokVideo = {
            id: crypto.randomUUID(),
            link: video.webVideoUrl,
            thumbnail: video.videoMeta.coverUrl || video.videoMeta.originalCoverUrl,
            creator,
            plays: video.playCount,
            likes: video.diggCount,
            comments: video.commentCount,
            shares: video.shareCount,
            saves: video.collectCount,
            caption: video.text,
            duration: video.videoMeta.duration,
            analysis,
            newConcepts: concepts,
            datePosted: video.createTimeISO,
            dateAdded: new Date().toISOString(),
            configName: options.configName,
            starred: false,
          };

          analyzedVideos.push(tiktokVideo);
          log(`${prefix} Done — ${formatCount(video.playCount)} plays, ${video.videoMeta.duration}s [total ${elapsed(videoStart)}]`);
          log(``);
        } catch (err) {
          const msg = `Error analyzing ${label} ...${shortId}: ${err instanceof Error ? err.message : err}`;
          progress.errors.push(msg);
          log(`${prefix} FAILED — ${err instanceof Error ? err.message : err} [${elapsed(videoStart)}]`);
          log(``);
        }

        progress.activeTasks = progress.activeTasks.filter((t) => t !== `${label} - ${shortId}`);
        progress.videosProcessed++;
        onProgress({ ...progress });
      }
  );

  await runWithConcurrency(tasks, 1);

  // ── Phase 3: Persistence ──
  log(`── PHASE 3: SAVING ──`);
  if (analyzedVideos.length > 0) {
    appendVideos(analyzedVideos);
    log(`Saved ${analyzedVideos.length} videos to database`);
  } else {
    log(`No videos were successfully analyzed`);
  }

  // ── Summary ──
  log(``);
  log(`── COMPLETE ──`);
  log(`Total time: ${elapsed(pipelineStart)}`);
  log(`Creators scraped: ${progress.creatorsProcessed}/${progress.creatorsTotal}`);
  log(`Videos analyzed: ${analyzedVideos.length}/${videosToAnalyze.length}`);
  if (progress.errors.length > 0) {
    log(`Errors: ${progress.errors.length}`);
  }

  progress.phase = "done";
  progress.activeTasks = [];
  onProgress({ ...progress });
}
