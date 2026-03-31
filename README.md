# GolfWRX Answers Platform

A Reddit-answers style platform that synthesizes GolfWRX community knowledge using AI.

## Structure
```
tyler-ps-wiyb/
├── backend/
│   ├── server.js      # Express + SSE streaming API
│   ├── scraper.js     # GolfWRX forums.golfwrx.com Cheerio scraper
│   └── package.json
└── frontend/
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Header.jsx           # GolfWRX-branded header
        │   ├── SearchPage.jsx       # Landing page with suggestions
        │   └── ConversationPage.jsx # Chat view with citations
```

## How it works
1. **Scraper** searches `forums.golfwrx.com` using IPS forum search, fetches top thread content (posts, usernames, dates)
2. **Backend** feeds scraped posts to Claude Opus 4.6 as context, streams the response via SSE
3. **Frontend** displays streamed text with a typing cursor, then shows **source cards** with thread title, contributing usernames, and direct forum links

## To run
```bash
# 1. Create backend/.env with your API key:
echo "ANTHROPIC_API_KEY=your_key" > backend/.env

# 2. Install & start everything:
npm run install:all
npm run dev
```

Frontend: `http://localhost:5173` · Backend: `http://localhost:3001`

## Design
- Colors: `#000000` (bg), `#ffffff` (text), `#35000a` (maroon accents) matching GolfWRX branding
- Dark theme throughout with sticky header, follow-up input bar, and citation source cards
