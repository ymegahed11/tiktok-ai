import { NextRequest } from "next/server";
import { readCreators, writeCreators } from "@/lib/csv";
import { scrapeCreatorStats } from "@/lib/apify";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body.ids;

  const allCreators = readCreators();
  const toRefresh = ids
    ? allCreators.filter((c) => ids.includes(c.id))
    : allCreators;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let completed = 0;
      for (const creator of toRefresh) {
        try {
          const stats = await scrapeCreatorStats(creator.username);
          const idx = allCreators.findIndex((c) => c.id === creator.id);
          if (idx !== -1) {
            allCreators[idx] = {
              ...allCreators[idx],
              ...stats,
              lastScrapedAt: new Date().toISOString(),
            };
          }
          completed++;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                completed,
                total: toRefresh.length,
                current: creator.username,
              })}\n\n`
            )
          );
        } catch (err) {
          completed++;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                completed,
                total: toRefresh.length,
                current: creator.username,
                error: String(err),
              })}\n\n`
            )
          );
        }
      }
      writeCreators(allCreators);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
