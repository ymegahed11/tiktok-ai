import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import fs from "fs";
import path from "path";
import { TikTokVideo, Creator, Config } from "./types";

const DATA_DIR = path.join(process.cwd(), "..", "data");

let writeLock = Promise.resolve();

function withWriteLock<T>(fn: () => T): Promise<T> {
  const next = writeLock.then(fn, fn);
  writeLock = next.then(() => {}, () => {});
  return next;
}

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(name: string) {
  return path.join(DATA_DIR, name);
}

export function readCsv<T>(filename: string): T[] {
  ensureDataDir();
  const fp = filePath(filename);
  if (!fs.existsSync(fp)) return [];
  const content = fs.readFileSync(fp, "utf-8").trim();
  if (!content) return [];
  try {
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      cast: (value, context) => {
        if (context.header) return value;
        if (value === "true") return true;
        if (value === "false") return false;
        return value;
      },
    }) as T[];
  } catch {
    return [];
  }
}

function writeCsvSync<T extends Record<string, unknown>>(
  filename: string,
  records: T[],
  columns: string[]
) {
  ensureDataDir();
  const fp = filePath(filename);
  const tmpFp = fp + ".tmp";
  const output = stringify(records, { header: true, columns });
  fs.writeFileSync(tmpFp, output);
  fs.renameSync(tmpFp, fp);
}

const videoColumns = [
  "id", "link", "thumbnail", "creator", "plays", "likes", "comments",
  "shares", "saves", "caption", "duration", "analysis", "newConcepts",
  "datePosted", "dateAdded", "configName", "starred",
];

const creatorColumns = [
  "id", "username", "nickName", "category", "profilePicUrl", "followers",
  "totalHearts", "totalVideos", "verified", "bio", "lastScrapedAt",
];

const configColumns = [
  "id", "configName", "creatorsCategory", "analysisInstruction",
  "newConceptsInstruction",
];

export function readVideos(): TikTokVideo[] {
  const rows = readCsv<Record<string, string>>("videos.csv");
  return rows.map((r) => ({
    ...r,
    plays: Number(r.plays) || 0,
    likes: Number(r.likes) || 0,
    comments: Number(r.comments) || 0,
    shares: Number(r.shares) || 0,
    saves: Number(r.saves) || 0,
    duration: Number(r.duration) || 0,
    starred: String(r.starred) === "true",
  })) as unknown as TikTokVideo[];
}

export function writeVideos(videos: TikTokVideo[]) {
  return withWriteLock(() =>
    writeCsvSync("videos.csv", videos as unknown as Record<string, unknown>[], videoColumns)
  );
}

export function appendVideos(newVideos: TikTokVideo[]) {
  return withWriteLock(() => {
    const existing = readVideos();
    writeCsvSync("videos.csv", [...existing, ...newVideos] as unknown as Record<string, unknown>[], videoColumns);
  });
}

export function readCreators(): Creator[] {
  const rows = readCsv<Record<string, string>>("creators.csv");
  return rows.map((r) => ({
    ...r,
    followers: Number(r.followers) || 0,
    totalHearts: Number(r.totalHearts) || 0,
    totalVideos: Number(r.totalVideos) || 0,
    verified: String(r.verified) === "true",
  })) as unknown as Creator[];
}

export function writeCreators(creators: Creator[]) {
  return withWriteLock(() =>
    writeCsvSync("creators.csv", creators as unknown as Record<string, unknown>[], creatorColumns)
  );
}

export function readConfigs(): Config[] {
  return readCsv<Config>("configs.csv");
}

export function writeConfigs(configs: Config[]) {
  return withWriteLock(() =>
    writeCsvSync("configs.csv", configs as unknown as Record<string, unknown>[], configColumns)
  );
}
