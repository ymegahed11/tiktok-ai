// Rewrites videos.csv with correct formatting, ensuring KAIRO entries parse properly
const fs = require("fs");
const path = require("path");
const {parse} = require("csv-parse/sync");
const {stringify} = require("csv-stringify/sync");

const CSV = path.join(__dirname, "data", "videos.csv");

const content = fs.readFileSync(CSV, "utf-8").trim();
const rows = parse(content, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true,
});

// Strip the leading \n from IDs caused by the append bug
rows.forEach(r => {
  if (r.id) r.id = r.id.replace(/^\n+/, "");
});

// Remove duplicates by id (keep last occurrence for KAIRO entries)
const seen = new Map();
rows.forEach(r => seen.set(r.id, r));
const clean = [...seen.values()];

const columns = [
  "id","link","thumbnail","creator","plays","likes","comments",
  "shares","saves","caption","duration","analysis","newConcepts",
  "datePosted","dateAdded","configName","starred"
];

const output = stringify(clean, { header: true, columns });
fs.writeFileSync(CSV, output);
console.log(`✅ Rewrote videos.csv with ${clean.length} entries`);
const kairo = clean.filter(r => r.creator === "kairouk");
console.log(`📦 KAIRO entries: ${kairo.length}`);
kairo.forEach(r => console.log(`   - ${r.id}`));
