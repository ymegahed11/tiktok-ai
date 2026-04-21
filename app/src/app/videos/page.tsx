"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, MessageCircle, Film, Sparkles, Search, Star, Play, ArrowUpDown, ExternalLink, Share2, Bookmark } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import type { TikTokVideo, Config } from "@/lib/types";

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

type SortOption = "plays" | "datePosted" | "dateAdded" | "starred";

export default function VideosPage() {
  return (
    <Suspense>
      <VideosContent />
    </Suspense>
  );
}

function VideosContent() {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [filterConfig, setFilterConfig] = useState<string>("all");
  const [filterCreator, setFilterCreator] = useState<string>(searchParams.get("creator") || "all");
  const [sortBy, setSortBy] = useState<SortOption>("plays");
  const [modalVideo, setModalVideo] = useState<TikTokVideo | null>(null);
  const [modalSection, setModalSection] = useState<"analysis" | "concepts">("analysis");

  useEffect(() => {
    fetch("/api/videos").then((r) => r.json()).then(setVideos);
    fetch("/api/configs").then((r) => r.json()).then(setConfigs);
  }, []);

  const uniqueCreators = [...new Set(videos.map((v) => v.creator))].sort();

  const filtered = videos
    .filter((v) => {
      if (filterConfig !== "all" && v.configName !== filterConfig) return false;
      if (filterCreator !== "all" && v.creator !== filterCreator) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "starred") {
        if (a.starred !== b.starred) return a.starred ? -1 : 1;
        return b.plays - a.plays;
      }
      if (sortBy === "plays") return b.plays - a.plays;
      if (sortBy === "datePosted") return (b.datePosted || "").localeCompare(a.datePosted || "");
      if (sortBy === "dateAdded") return (b.dateAdded || "").localeCompare(a.dateAdded || "");
      return 0;
    });

  const openModal = (video: TikTokVideo, section: "analysis" | "concepts") => {
    setModalVideo(video);
    setModalSection(section);
  };

  const toggleStar = async (id: string, currentStarred: boolean) => {
    const newStarred = !currentStarred;
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, starred: newStarred } : v))
    );
    await fetch("/api/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, starred: newStarred }),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse analyzed TikTok videos with AI insights
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterConfig} onValueChange={(v) => v && setFilterConfig(v)}>
          <SelectTrigger className="w-[220px] rounded-xl glass border-white/[0.08] h-10">
            <SelectValue placeholder="Filter by config" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Configs</SelectItem>
            {configs.map((c) => (
              <SelectItem key={c.id} value={c.configName}>{c.configName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCreator} onValueChange={(v) => v && setFilterCreator(v)}>
          <SelectTrigger className="w-[200px] rounded-xl glass border-white/[0.08] h-10">
            <SelectValue placeholder="Filter by creator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Creators</SelectItem>
            {uniqueCreators.map((c) => (
              <SelectItem key={c} value={c}>@{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => v && setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px] rounded-xl glass border-white/[0.08] h-10">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plays">Most Plays</SelectItem>
            <SelectItem value="datePosted">Date Posted</SelectItem>
            <SelectItem value="dateAdded">Date Added</SelectItem>
            <SelectItem value="starred">Starred First</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs bg-white/[0.05] border border-white/[0.08]">
          {filtered.length} videos
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((video) => (
          <div key={video.id} className="group">
            <div className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/[0.12]">
              <a
                href={video.link}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-[9/16] w-full bg-white/[0.02] overflow-hidden"
              >
                {video.thumbnail ? (
                  <img
                    src={`/api/proxy-image?url=${encodeURIComponent(video.thumbnail)}`}
                    alt={`@${video.creator}`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Film className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <Play className="h-4 w-4 text-white fill-white" />
                    <span className="text-[15px] font-bold text-white">
                      {formatCount(video.plays)}
                    </span>
                  </div>
                </div>
              </a>

              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">@{video.creator}</p>
                  <button
                    onClick={() => toggleStar(video.id, video.starred)}
                    className="shrink-0 ml-1.5 transition-colors"
                  >
                    <Star
                      className={`h-4 w-4 ${video.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40 hover:text-yellow-400/60"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {formatCount(video.likes)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {formatCount(video.comments)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    {formatCount(video.shares)}
                  </span>
                  <span className="ml-auto text-[10px]">{video.datePosted}</span>
                </div>

                <Badge variant="secondary" className="rounded-md text-[10px] bg-white/[0.05] border border-white/[0.06] text-muted-foreground">
                  {video.configName}
                </Badge>

                <div className="flex gap-1.5 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal(video, "analysis")}
                    className="flex-1 rounded-xl text-[11px] h-7 gap-1 transition-all duration-200 glass border-white/[0.06] text-muted-foreground hover:text-foreground"
                  >
                    <Search className="h-3 w-3" />
                    Analysis
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal(video, "concepts")}
                    className="flex-1 rounded-xl text-[11px] h-7 gap-1 transition-all duration-200 glass border-white/[0.06] text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="h-3 w-3" />
                    Concepts
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Film className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No videos found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Run a pipeline analysis to generate results, or adjust your filters.
          </p>
        </div>
      )}

      <Dialog open={!!modalVideo} onOpenChange={(open) => { if (!open) setModalVideo(null); }}>
        <DialogContent className="!flex !flex-col max-w-4xl max-h-[85vh] overflow-hidden glass-strong rounded-2xl border-white/[0.08] p-0 gap-0">
          <DialogTitle className="sr-only">
            {modalSection === "analysis" ? "Video Analysis" : "New Concepts"}
          </DialogTitle>
          {modalVideo && (
            <>
              <div className="shrink-0 border-b border-white/[0.06]">
                <div className="flex items-center gap-4 px-6 pt-5 pb-4">
                  <div className="relative h-14 w-10 shrink-0 rounded-lg overflow-hidden bg-white/[0.04]">
                    {modalVideo.thumbnail ? (
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(modalVideo.thumbnail)}`}
                        alt={`@${modalVideo.creator}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">@{modalVideo.creator}</p>
                      <a
                        href={modalVideo.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-purple-400 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Play className="h-3 w-3 fill-current" />
                        {formatCount(modalVideo.plays)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatCount(modalVideo.likes)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {formatCount(modalVideo.comments)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        {formatCount(modalVideo.shares)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bookmark className="h-3 w-3" />
                        {formatCount(modalVideo.saves)}
                      </span>
                    </div>
                  </div>
                </div>
                {modalVideo.caption && (
                  <p className="px-6 pb-3 text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                    {modalVideo.caption}
                  </p>
                )}
                <div className="flex gap-0 px-6">
                  <button
                    onClick={() => setModalSection("analysis")}
                    className={`relative px-4 pb-3 text-sm font-medium transition-colors duration-200 ${
                      modalSection === "analysis"
                        ? "text-purple-300"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5" />
                      Analysis
                    </span>
                    {modalSection === "analysis" && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-purple-500 to-violet-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setModalSection("concepts")}
                    className={`relative px-4 pb-3 text-sm font-medium transition-colors duration-200 ${
                      modalSection === "concepts"
                        ? "text-indigo-300"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Concepts
                    </span>
                    {modalSection === "concepts" && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto min-h-0 flex-1 px-8 py-6">
                <MarkdownContent
                  content={modalSection === "analysis" ? modalVideo.analysis : modalVideo.newConcepts}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
