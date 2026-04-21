# Current Data

## App Status

| Component | Status | Notes |
| --------- | ------ | ----- |
| TikTok scraping (Apify) | Working | `clockworks~tiktok-scraper`, tested with all 6 creators |
| Video download | Working | Direct TikTok CDN URLs with 120s timeout, rejects < 1KB |
| Gemini video upload | Working | Resumable upload protocol with `waitForFileActive` polling |
| Gemini video analysis | Working | 2.5 Flash, exponential backoff for 429s/503s (5 retries). Free tier has daily quota |
| Claude concept generation | Working | `claude-sonnet-4-5-20250929`, max_tokens 4096 |
| Pipeline SSE streaming | Working | Real-time progress with phase tracking, verbose logs with timing |
| UI — dark glass-morphism | Complete | Matches Instagram reference app aesthetic |
| CSV persistence | Working | creators.csv, videos.csv, configs.csv in data/ with write locks |
| Markdown rendering | Complete | Custom `.markdown-body` CSS for dark theme, full typography system |

## Seeded Creators

| Username | Category | Status |
| -------- | -------- | ------ |
| xoxoemira | beauty-lifestyle | Seeded, real Apify data |
| alixearle | beauty-lifestyle | Seeded, real Apify data |
| golloria | beauty-lifestyle | Seeded, real Apify data |
| lydiamillen | beauty-lifestyle | Seeded, real Apify data |
| leticiafgomes | beauty-lifestyle | Seeded, real Apify data |
| haileybieber | beauty-lifestyle | Added by user |

## Known Limitations

- Gemini free tier has daily quota limits — pipeline may hit 429 errors during heavy testing
- TikTok CDN thumbnails require proxy (`/api/proxy-image`) to avoid CORS
- No database — CSV storage works for small scale but won't scale to large datasets
