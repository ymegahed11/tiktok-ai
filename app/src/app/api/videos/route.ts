import { NextRequest, NextResponse } from "next/server";
import { readVideos, writeVideos } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const configName = searchParams.get("configName");
  const creator = searchParams.get("creator");

  let videos = readVideos();
  if (configName) videos = videos.filter((v) => v.configName === configName);
  if (creator) videos = videos.filter((v) => v.creator === creator);

  return NextResponse.json(videos);
}

export async function PATCH(req: NextRequest) {
  const { id, starred } = await req.json();
  const videos = readVideos();
  const idx = videos.findIndex((v) => v.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  videos[idx].starred = starred;
  writeVideos(videos);
  return NextResponse.json(videos[idx]);
}
