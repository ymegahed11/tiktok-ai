import { ApifyTikTokResult } from "./types";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const BASE_URL = "https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items";

export async function scrapeTikToks(
  username: string,
  maxCount: number = 20,
  daysLookback: number = 30
): Promise<ApifyTikTokResult[]> {
  const res = await fetch(`${BASE_URL}?token=${APIFY_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profiles: [username],
      profileScrapeSections: ["videos"],
      profileSorting: "latest",
      scrapeLastNDays: daysLookback,
      shouldDownloadVideos: true,
      videoKvStoreIdOrName: "tiktok-videos",
      resultsPerPage: maxCount,
    }),
    signal: AbortSignal.timeout(180_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Apify scrape failed for @${username} (${res.status}): ${errText.slice(0, 200)}`);
  }

  let data: ApifyTikTokResult[];
  try {
    data = await res.json();
  } catch {
    throw new Error(`Apify returned invalid JSON for @${username}`);
  }

  if (!Array.isArray(data)) {
    throw new Error(`Apify returned non-array for @${username}: ${JSON.stringify(data).slice(0, 200)}`);
  }

  return data.filter(
    (v) => v.videoMeta?.downloadAddr && !v.isSlideshow
  );
}

export async function scrapeCreatorStats(username: string) {
  const res = await fetch(`${BASE_URL}?token=${APIFY_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profiles: [username],
      profileScrapeSections: ["videos"],
      profileSorting: "latest",
      scrapeLastNDays: 365,
      shouldDownloadVideos: false,
      resultsPerPage: 1,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Apify stats failed for @${username} (${res.status}): ${errText.slice(0, 200)}`);
  }

  let data: ApifyTikTokResult[];
  try {
    data = await res.json();
  } catch {
    throw new Error(`Apify returned invalid JSON for @${username} stats`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No data returned for @${username}`);
  }

  const meta = data[0].authorMeta;
  if (!meta) {
    throw new Error(`No authorMeta in response for @${username}`);
  }

  return {
    username: meta.name || username,
    nickName: meta.nickName || username,
    followers: meta.fans || 0,
    totalHearts: meta.heart || 0,
    totalVideos: meta.video || 0,
    profilePicUrl: meta.avatar || "",
    verified: meta.verified || false,
    bio: meta.signature || "",
  };
}
