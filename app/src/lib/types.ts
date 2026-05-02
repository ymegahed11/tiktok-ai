export interface ApifyTikTokResult {
  id: string;
  text: string;
  createTimeISO: string;
  playCount: number;
  diggCount: number;
  shareCount: number;
  commentCount: number;
  collectCount: number;
  webVideoUrl: string;
  isSlideshow: boolean;
  isPinned: boolean;
  isSponsored: boolean;
  hashtags: { name: string }[];
  authorMeta: {
    name: string;
    nickName: string;
    fans: number;
    heart: number;
    video: number;
    avatar: string;
    verified: boolean;
    signature: string;
    bioLink?: string;
  };
  videoMeta: {
    duration: number;
    height: number;
    width: number;
    coverUrl: string;
    originalCoverUrl: string;
    downloadAddr?: string;
    subtitleLinks?: { language: string; downloadLink: string }[];
  };
  videoUrl?: string;
  musicMeta: {
    musicName: string;
    musicAuthor: string;
    musicOriginal: boolean;
  };
}

export interface TikTokVideo {
  id: string;
  link: string;
  thumbnail: string;
  creator: string;
  plays: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  caption: string;
  duration: number;
  analysis: string;
  newConcepts: string;
  datePosted: string;
  dateAdded: string;
  configName: string;
  starred: boolean;
}

export interface Creator {
  id: string;
  username: string;
  nickName: string;
  category: string;
  profilePicUrl: string;
  followers: number;
  totalHearts: number;
  totalVideos: number;
  verified: boolean;
  bio: string;
  lastScrapedAt: string;
}

export interface Config {
  id: string;
  configName: string;
  creatorsCategory: string;
  analysisInstruction: string;
  newConceptsInstruction: string;
}

export interface PipelineProgress {
  phase: "scraping" | "analyzing" | "done" | "error";
  creatorsProcessed: number;
  creatorsTotal: number;
  videosProcessed: number;
  videosTotal: number;
  activeTasks: string[];
  errors: string[];
  log: string[];
}
