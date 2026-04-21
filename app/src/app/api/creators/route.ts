import { NextRequest, NextResponse } from "next/server";
import { readCreators, writeCreators } from "@/lib/csv";
import { scrapeCreatorStats } from "@/lib/apify";
import crypto from "crypto";

export async function GET() {
  return NextResponse.json(readCreators());
}

export async function POST(req: NextRequest) {
  const { username, category } = await req.json();
  if (!username || !category) {
    return NextResponse.json({ error: "username and category required" }, { status: 400 });
  }

  const creators = readCreators();
  if (creators.some((c) => c.username === username)) {
    return NextResponse.json({ error: "Creator already exists" }, { status: 409 });
  }

  let stats;
  try {
    stats = await scrapeCreatorStats(username);
  } catch {
    stats = {
      username,
      nickName: username,
      followers: 0,
      totalHearts: 0,
      totalVideos: 0,
      profilePicUrl: "",
      verified: false,
      bio: "",
    };
  }

  const creator = {
    id: crypto.randomUUID(),
    ...stats,
    category,
    lastScrapedAt: new Date().toISOString(),
  };

  creators.push(creator);
  writeCreators(creators);
  return NextResponse.json(creator, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const updates = await req.json();
  const creators = readCreators();
  const idx = creators.findIndex((c) => c.id === updates.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  creators[idx] = { ...creators[idx], ...updates };
  writeCreators(creators);
  return NextResponse.json(creators[idx]);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const creators = readCreators();
  const filtered = creators.filter((c) => c.id !== id);
  if (filtered.length === creators.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  writeCreators(filtered);
  return NextResponse.json({ success: true });
}
