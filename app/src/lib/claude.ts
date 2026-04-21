import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateConcepts(
  videoAnalysis: string,
  prompt: string
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system:
      "You are a TikTok content specialist who adapts reference videos into original concepts while following custom guidelines.",
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nVideo Analysis:\n${videoAnalysis}`,
      },
    ],
  });

  if (!message.content || message.content.length === 0) {
    throw new Error(`Claude returned empty response (stop_reason: ${message.stop_reason})`);
  }

  const block = message.content[0];
  if (block.type !== "text" || !block.text) {
    throw new Error(`Claude returned non-text block: ${block.type}`);
  }

  return block.text;
}
