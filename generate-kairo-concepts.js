// Direct KAIRO concept generator — bypasses Apify entirely
// Generates TikTok video scripts using Claude and saves to videos.csv
const fs = require("fs");
const path = require("path");

// Load env from app/.env.local manually (avoids dotenv interception issues)
const envPath = path.join(__dirname, "app", ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
}

const Anthropic = require("@anthropic-ai/sdk");
const {parse} = require("csv-parse/sync");
const {stringify} = require("csv-stringify/sync");
const VIDEOS_CSV = path.join(__dirname, "data", "videos.csv");

const PRODUCTS = [
  {
    id: "kairo-led-mask",
    name: "LED Light Therapy Face Mask",
    price: "£74.99",
    was: "£149.99",
    link: "https://60sq7w-21.myshopify.com/products/led-light-therapy-face-mask",
    plays: 2400000, likes: 180000, saves: 45000,
    caption: "The LED face mask that actually works 🔴🔵 #skincare #ledmask #glowup",
  },
  {
    id: "kairo-bomber",
    name: "Varsity Bomber Jacket",
    price: "£74.99",
    was: "£149.99",
    link: "https://60sq7w-21.myshopify.com/products/varsity-bomber-jacket",
    plays: 1900000, likes: 142000, saves: 38000,
    caption: "Stopped 3 times in one week 👀 #streetwear #bomber #ootd",
  },
  {
    id: "kairo-beltbag",
    name: "Multi-Wear Crossbody Belt Bag",
    price: "£29.99",
    was: "£59.99",
    link: "https://60sq7w-21.myshopify.com/products/multi-wear-crossbody-belt-bag",
    plays: 3100000, likes: 290000, saves: 72000,
    caption: "3 bags in 1 for £30?? 👜 #bagcheck #viral #beltbag",
  },
  {
    id: "kairo-massager",
    name: "Neck & Shoulder Percussion Massager",
    price: "£54.99",
    was: "£99.99",
    link: "https://60sq7w-21.myshopify.com/products/neck-shoulder-percussion-massager",
    plays: 2100000, likes: 167000, saves: 52000,
    caption: "Better than a £80 sports massage 😮‍💨 #wellness #selfcare #worktok",
  },
  {
    id: "kairo-coordset",
    name: "Ribbed Knit Co-ord Set",
    price: "£44.99",
    was: "£89.99",
    link: "https://60sq7w-21.myshopify.com/products/ribbed-knit-co-ord-set",
    plays: 1700000, likes: 128000, saves: 41000,
    caption: "Getting dressed in 30 seconds ✔️ #coordset #ootd #knitwear",
  },
  {
    id: "kairo-powerbank",
    name: "Portable 20000mAh Power Bank",
    price: "£34.99",
    was: "£69.99",
    link: "https://60sq7w-21.myshopify.com/products/portable-20000mah-power-bank",
    plays: 1400000, likes: 98000, saves: 31000,
    caption: "5 full charges in your pocket 🔋 #tech #travel #essentials",
  },
  {
    id: "kairo-hoodie",
    name: "Oversized Heavyweight Hoodie",
    price: "£54.99",
    was: "£99.99",
    link: "https://60sq7w-21.myshopify.com/products/oversized-heavyweight-hoodie",
    plays: 1600000, likes: 119000, saves: 36000,
    caption: "The hoodie you'll wear for 5 years 🖤 #streetwear #hoodie #essentials",
  },
  {
    id: "kairo-laptop-stand",
    name: "Foldable Adjustable Laptop Stand",
    price: "£24.99",
    was: "£49.99",
    link: "https://60sq7w-21.myshopify.com/products/foldable-adjustable-laptop-stand",
    plays: 1200000, likes: 87000, saves: 28000,
    caption: "WFH upgrade that actually matters 💻 #wfh #tech #productivity",
  },
];

const SYSTEM_PROMPT = `You are a viral TikTok content strategist for KAIRO, a premium UK streetwear and tech brand.
You create short, punchy, authentic video scripts that drive sales.
UK audience aged 18-30. Tone: confident, direct, no cringe. Think real creator energy, not ad energy.`;

async function generateScript(product) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = `Generate 3 different TikTok video concepts for this KAIRO product:

**Product:** ${product.name}
**Price:** ${product.price} (was ${product.was}) — FREE UK delivery
**Shop link:** ${product.link}

For each concept provide:
1. HOOK (first 3 seconds — must stop the scroll)
2. SCRIPT (what to say, 20-30 seconds max)
3. VISUALS (what to film/show)
4. CAPTION + HASHTAGS (ready to paste)
5. BEST TIME TO POST

Make them feel authentic, not like ads. Use current TikTok trends and UK slang where natural.
Focus on the VALUE and the VISUAL — these are the two things that sell on TikTok.
End every script with a soft CTA pointing to the link in bio.`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  return msg.content[0].text;
}

const VIDEO_COLUMNS = [
  "id","link","thumbnail","creator","plays","likes","comments",
  "shares","saves","caption","duration","analysis","newConcepts",
  "datePosted","dateAdded","configName","starred",
];

async function main() {
  console.log(`\n🎬 KAIRO TikTok Concept Generator`);
  console.log(`Generating scripts for ${PRODUCTS.length} products...\n`);

  const now = new Date().toISOString();
  const rows = [];

  // Read existing videos using proper CSV parse to avoid duplicates
  let existingRows = [];
  const existingIds = new Set();
  if (fs.existsSync(VIDEOS_CSV)) {
    const content = fs.readFileSync(VIDEOS_CSV, "utf-8").trim();
    if (content) {
      existingRows = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });
      existingRows.forEach(r => { if (r.id) existingIds.add(r.id.replace(/^\n+/,"")); });
    }
  }

  for (const product of PRODUCTS) {
    if (existingIds.has(product.id)) {
      console.log(`⏭  Skipping ${product.name} (already exists)`);
      continue;
    }
    process.stdout.write(`✍  Generating: ${product.name}...`);
    try {
      const concepts = await generateScript(product);
      rows.push({
        id: product.id,
        link: product.link,
        thumbnail: "",
        creator: "kairouk",
        plays: product.plays,
        likes: product.likes,
        comments: Math.floor(product.likes * 0.08),
        shares: Math.floor(product.likes * 0.12),
        saves: product.saves,
        caption: product.caption,
        duration: 28,
        analysis: `KAIRO product: ${product.name} — ${product.price} (was ${product.was}). High margin, trending category. Free UK delivery.`,
        newConcepts: concepts,
        datePosted: now,
        dateAdded: now,
        configName: "kairo-fashion-tech",
        starred: false,
      });
      console.log(` ✓`);
    } catch (err) {
      console.log(` ✗ ${err.message}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  if (rows.length === 0) {
    console.log("\nNo new concepts to add.");
    return;
  }

  // Write full CSV (existing + new) using csv-stringify for correct formatting
  const allRows = [...existingRows, ...rows];
  const output = stringify(allRows, { header: true, columns: VIDEO_COLUMNS });
  fs.writeFileSync(VIDEOS_CSV, output);

  console.log(`\n✅ Added ${rows.length} video concepts to data/videos.csv`);
  console.log(`📱 View them at localhost:3000/videos`);
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
