import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "path";

// Load root .env first so process.env is populated before nextConfig reads it
config({ path: path.join(__dirname, "..", ".env") });
// Also load app/.env as fallback
config({ path: path.join(__dirname, ".env") });

const nextConfig: NextConfig = {
  env: {
    APIFY_API_TOKEN: process.env.APIFY_API_TOKEN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.tiktokcdn-us.com" },
      { protocol: "https", hostname: "**.tiktokcdn.com" },
      { protocol: "https", hostname: "api.apify.com" },
    ],
  },
};

export default nextConfig;
