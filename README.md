# Investment Research Workbench

InsideIIM / Altuni AI Labs take-home assignment: an AI investment research agent that researches a public company, scores it across multiple dimensions, and produces an `INVEST` or `PASS` recommendation with an evidence-backed dashboard.

## Overview

The app accepts a company name or ticker and runs a multi-factor research workflow. It searches the web, asks an LLM analyst to synthesize evidence, validates the structured JSON response, stores the report in Neon Postgres, and renders the result as a clean white/neon dashboard with charts, metrics, sources, thesis points, watch items, and research history.

The current report covers:

- Business quality
- Financial health
- Valuation discipline
- Development pipeline
- Market position
- Risk control
- Sentiment and governance

## How To Run It

### Prerequisites

- Node.js 18 or newer
- Groq API key from `https://console.groq.com`
- Neon Postgres connection string from `https://neon.tech`

### Environment Variables

Create `.env.local` in the project root. Use `.env.example` as the template.

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=postgres://username:password@hostname/dbname?sslmode=require
```

`GROQ_API_KEY` is required for the LLM analyst. `DATABASE_URL` is required for saving and loading research history. `GROQ_MODEL` is optional; use any Groq chat model available to your account.

### Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

### Vercel Deployment

Use these Vercel settings:

- Framework preset: `Next.js`
- Root directory: `./` if this folder is the repo root, otherwise `investment-agent`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave as Next.js default

Add these environment variables in Vercel before deploying:

- `GROQ_API_KEY`
- `DATABASE_URL`
- `GROQ_MODEL` optional

## How It Works

```text
User enters company
        |
        v
Next.js client page
        |
        v
POST /api/research
        |
        v
LangGraph ReAct agent + ChatGroq
        |
        v
DuckDuckGo search tool for current public information
        |
        v
Structured JSON report validation
        |
        v
Neon Postgres storage
        |
        v
Dashboard with factor charts, metrics, thesis, risks, and sources
```

### Main Files

- `app/page.tsx`: client workflow for search, loading, report state, and history selection.
- `app/api/research/route.ts`: validates the company input, runs the agent, and saves the report.
- `lib/agent.ts`: defines the LangGraph ReAct agent, web search tool, prompt, and JSON parsing.
- `lib/report-utils.ts`: normalizes report data so the UI and database receive a stable structure.
- `lib/db.ts`: initializes/migrates Neon tables and stores/fetches reports.
- `components/report/*`: dashboard widgets for charts, factor cards, metrics, sources, and report header.

## Approach And Architecture

The frontend uses Next.js App Router with focused React components. The App Router handles routing and API endpoints, while components keep the UI maintainable and easy to explain. Report-specific widgets live under `components/report` so the dashboard is not clustered inside one large page file.

The backend uses a LangGraph ReAct agent with a custom `web_search` tool powered by `duck-duck-scrape`. The agent is prompted to perform multiple searches and return a strict JSON report. The API route parses and normalizes the response before saving it.

Neon Postgres stores reports as structured JSON text fields. The database initializer uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` so older deployments can migrate safely when the report schema changes.

## Key Decisions And Trade-Offs

- Next.js App Router was chosen because the assignment needs a full-stack app with UI and API routes in one deployable project.
- LangGraph ReAct was chosen because the agent needs to search, reason, and then produce a structured decision.
- Groq was chosen for fast hosted LLM inference and simple API-key setup.
- DuckDuckGo scraping was chosen to avoid requiring an additional paid search API key.
- Neon serverless Postgres was chosen because it works well with Vercel deployments and keeps setup lightweight.
- Raw SQL was chosen over Prisma to reduce setup overhead and cold-start complexity for a small assignment app.
- The UI uses local CSS instead of a component library so the dashboard can have a distinct white/neon analyst-workbench look.

What was left out:

- Streaming live agent logs to the UI.
- Side-by-side company comparison.
- PDF export.
- Authentication and multi-user workspaces.
- Automated scheduled refresh of old reports.

## Example Runs

The exact output changes because the agent searches live public information. These are representative example outputs showing the expected report style.

### NVIDIA

- Decision: `INVEST`
- Confidence: `86`
- Summary: NVIDIA screens positively because of its dominant AI accelerator position, CUDA ecosystem, strong data center growth, and continuing product roadmap. The main caution is valuation sensitivity and dependence on continued AI infrastructure spending.
- Strong factors: business quality, financial health, development pipeline, market position.
- Watch items: forward valuation, export restrictions, hyperscaler custom silicon, supply-chain concentration.

### Apple

- Decision: `INVEST`
- Confidence: `74`
- Summary: Apple remains a high-quality compounder with a durable ecosystem, large services base, strong cash generation, and disciplined capital returns. Growth is more mature, so the recommendation depends on services growth, device refresh cycles, and valuation discipline.
- Strong factors: business quality, financial health, governance.
- Watch items: iPhone growth, China exposure, regulatory pressure on App Store economics, AI product execution.

### GameStop

- Decision: `PASS`
- Confidence: `82`
- Summary: GameStop has improved balance-sheet flexibility but still lacks a convincing durable growth engine compared with stronger technology or consumer platforms. The stock remains heavily sentiment-driven, making fundamentals hard to connect with valuation.
- Strong factors: cash position and low debt risk.
- Watch items: operating losses, revenue decline, turnaround clarity, valuation volatility.

## What I Would Improve With More Time

- Add streaming server-sent events so the UI can show the exact searches and agent progress.
- Add a compare mode for two or three companies.
- Add export to PDF for submitting research memos.
- Add source quality scoring so filings and official investor relations pages are weighted above blogs.
- Add tests around report normalization and database migration behavior.
- Add a background refresh job for stale reports.

## Bonus: LLM Build Transcript / Log

This project was built with LLM assistance. A concise build-session log is included at:

`docs/LLM_BUILD_LOG.md`

The log records the major prompts, decisions, implementation steps, verification commands, and deployment/package preparation notes. It is included as a practical transcript-style artifact without secrets or private environment values.

## Submission Package Notes

The zip package should include source code, `README.md`, `.env.example`, and `docs/LLM_BUILD_LOG.md`.

The zip package should not include:

- `.env.local`
- `node_modules`
- `.next`
- `.git`
- Vercel local metadata
