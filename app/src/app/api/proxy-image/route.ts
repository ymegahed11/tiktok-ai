import { NextRequest } from "next/server";

const ALLOWED_HOSTS = [
  "tiktokcdn-us.com",
  "tiktokcdn.com",
  "tiktokcdn-eu.com",
  "musical.ly",
  "p16-common-sign.tiktokcdn-us.com",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.some((h) => parsed.hostname.endsWith(h));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response("url parameter required", { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return new Response("URL not allowed — only TikTok CDN domains", { status: 403 });
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });

    if (!res.ok) {
      return new Response(`Upstream returned ${res.status}`, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Failed to fetch image: ${msg}`, { status: 502 });
  }
}
