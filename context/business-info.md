# Business Info

## Organization Overview

Oleg builds AI-powered content creation tools for social media. The focus is on helping creators and brands produce viral short-form video content by analyzing what works for top creators in their niche.

## Products / Services / Focus Areas

- **Social Media AI (Instagram)** — Existing app that curates Instagram creator databases, scrapes their latest Reels, analyzes them with Gemini, and generates new content concepts with Claude. Live at github.com/melnikoff-oleg/social-media.
- **TikTok AI** — This project. Same concept ported to TikTok. Scrapes TikTok videos via Apify, analyzes with Gemini multimodal, generates concepts with Claude. Dark glass-morphism UI matching the Instagram app exactly.

## Key Context

- Both apps share the same architecture: Apify scraping → Gemini video analysis → Claude concept generation → CSV storage
- The Instagram app is the canonical reference for UI/UX — TikTok AI must match its aesthetic exactly (dark theme, glass-morphism, purple gradients)
- Target niche: beauty, lifestyle, fashion. Pre-configured with "Bella Glow" brand persona
- Tech: Next.js 16 (Turbopack), TypeScript, Tailwind v4, shadcn/ui with base-ui primitives
