# Strategy

## Current Focus Period

April 2026 — TikTok AI app build, polish, and stabilization.

## Strategic Priorities

1. **TikTok AI MVP complete** — Port of Instagram Social Media AI to TikTok with identical UX quality is functional
2. **Pipeline reliability** — Scraping, video analysis, and concept generation work end-to-end with robust error handling and retries
3. **Aesthetic parity** — UI matches the Instagram app's dark glass-morphism design (purple gradients, backdrop-blur, rounded-2xl cards)
4. **Content quality** — Analysis/concepts modal displays AI output beautifully with proper markdown typography

## What Success Looks Like

- App runs locally, full pipeline executes without errors
- 6 seeded beauty/lifestyle creators scrape successfully
- Gemini analyzes videos and Claude generates usable concepts
- UI is polished and visually identical to the Instagram reference
- Long-form AI content (10-15K chars) renders beautifully in modals

## Key Decisions Made

- **Apify for scraping** — Using `clockworks~tiktok-scraper` actor (tested and working)
- **CSV storage** — Simple file-based storage matching Instagram app pattern, no database needed yet
- **Gemini 2.5 Flash** — For multimodal video analysis with resumable upload protocol (upgraded from deprecated 2.0 Flash)
- **Dark theme** — Matching Instagram app exactly with oklch color space, glass-morphism utilities
- **Sequential pipeline** — 1 worker for analysis phase to avoid Gemini rate limits
- **Custom markdown CSS** — `.markdown-body` in globals.css instead of Tailwind prose for full dark-theme control
