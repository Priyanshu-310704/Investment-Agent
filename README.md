# AI Investment Research Agent — InsideIIM Take-Home Assignment

An autonomous, full-stack **AI Investment Research Agent** that takes a company name, conducts comprehensive web research using custom DuckDuckGo scraping, analyzes financials/news/risks, and outputs a structured **INVEST / PASS** decision. 

Built for **InsideIIM × Altuni AI Labs** by pair programming with **Antigravity** (AI Coding Assistant).

---

## Overview

The AI Investment Research Agent acts as a virtual senior investment analyst. When queried with a company name, the agent:
1. Orchestrates multi-step web searches to gather recent news, stock metrics, financial statements, competitive positioning, and risk vectors.
2. Synthesizes findings using a Reasoning + Acting (ReAct) loop.
3. Formulates a final recommendation (**INVEST** or **PASS**) with confidence levels, a high-level summary, bull cases, bear cases, and key financial metrics.
4. Persists the report to a **Neon PostgreSQL** database.
5. Displays the analysis on a modern, premium **glassmorphic dark-mode dashboard** featuring loading step progress and a history of previous runs.

---

## How It Works

### Approach & Architecture

The application is structured as a full-stack Next.js (App Router) project utilizing standard API route handlers and React client components.

```
┌─────────────────────────────────────────────────────┐
│                 FRONTEND (Next.js App)              │
│                                                     │
│   Search Card  ───► Loading Animation ───► Results  │
│        │                                     ▲      │
│        ▼                                     │      │
│  API Routes (POST /api/research, GET /api/history)  │
│        │                                     ▲      │
├────────┼─────────────────────────────────────┼──────┤
│        ▼               BACKEND               │      │
│   LangGraph                                  │      │
│  ReAct Agent ────────────────────────────────┼┐     │
│        │                                     ││     │
│        ▼                                     ││     │
│  ┌───────────┐                               ││     │
│  │ ChatGroq  │                               ││     │
│  │ (LLM)     │                               ││     │
│  └───────────┘                               ││     │
│        │                                     ││     │
│        ▼                                     ││     │
│  ┌───────────┐                               ││     │
│  │  Custom   │                               ││     │
│  │  DDG Tool │                               ││     │
│  └───────────┘                               ││     │
│        │                                     ││     │
│        └─────────────────────────────────────┘│     │
│                                               ▼     │
│                                            Neon DB  │
└─────────────────────────────────────────────────────┘
```

1. **ReAct Agent Structure**: Built using `@langchain/langgraph/prebuilt` and `ChatGroq`. The agent uses the `web_search` tool to execute Google/DuckDuckGo queries via the `duck-duck-scrape` package.
2. **System Prompt**: The agent is guided by a system prompt directing it to gather:
   - Business model & products
   - Financial indicators (growth, valuation, margins)
   - Market sentiment & catalysts
   - Key risks & competitors
3. **Structured Extraction**: The agent is instructed to respond with a Markdown JSON block matching our TypeScript `ResearchReport` interface. The API route extracts this JSON, validates it, and writes it to the database.
4. **Database Integration**: Powered by `@neondatabase/serverless` using Neon's serverless Postgres driver. Database tables are automatically initialized during startup through `/api/init-db`.

---

## How to Run It

### 1. Prerequisites
- **Node.js** (v18.x or higher)
- A **Groq API Key** (Get one at [console.groq.com](https://console.groq.com) — free tier available).
- A **Neon PostgreSQL Connection String** (Create a database via Vercel Storage or [neon.tech](https://neon.tech) — free tier available).

### 2. Environment Setup
Create a `.env.local` file in the root directory (based on `.env.example`):
```env
# Required: Groq API Key
GROQ_API_KEY=gsk_your_actual_key_here

# Optional: Groq LLM model name (defaults to qwen-2.5-coder-32b)
GROQ_MODEL=qwen-2.5-coder-32b

# Required: PostgreSQL connection string
DATABASE_URL=postgres://username:password@hostname.neon.tech/dbname?sslmode=require
```

### 3. Installation
Navigate to the directory and install dependencies:
```bash
npm install
```

### 4. Running Locally
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The application will silently trigger `/api/init-db` on load to verify or construct the PostgreSQL table.

---

## Key Decisions & Trade-Offs

### What We Chose and Why

1. **Next.js + App Router**: Offers seamless full-stack integration. Having frontend pages and backend API routes in a single codebase makes deployment on Vercel instant and eliminates CORS overhead.
2. **Groq (`qwen-2.5-coder-32b` or similar)**: Groq offers ultra-low latency inference. We chose a modern active model because Meta deprecated `llama-3.3-70b-versatile` on Groq's public API endpoints as of June 2026. The `GROQ_MODEL` environment variable makes it easily configurable.
3. **LangGraph + createReactAgent**: Prebuilt LangGraph agents provide a stateful ReAct loop that is cleaner and more robust than the legacy `AgentExecutor` package from `langchain/agents` (which is now deprecated).
4. **duck-duck-scrape**: To run search without requiring the user to sign up for Google Custom Search or Tavily API keys (saving cost and configuration friction), we implemented a custom tool wrapper around `duck-duck-scrape` to query DuckDuckGo directly.
5. **@neondatabase/serverless**: Vercel sunset its native Postgres offering in June 2025 and transitioned to Neon. Using `@neondatabase/serverless` directly ensures edge compatibility and faster connection pooling than the deprecated `@vercel/postgres` package.
6. **Vanilla CSS**: Kept styling light, fast, and fully customized. Used modern CSS variables, glassmorphic filters, and breathing keyframe animations to create a premium UI experience.

### What We Left Out

1. **Heavy ORMs (e.g., Prisma)**: To keep deployment fast, minimize cold starts on Vercel serverless functions, and reduce project bundle size, we used raw SQL parameterized templates via the Neon serverless client.
2. **Streaming Agent Logs**: We opted for a structured polling-like loading screen indicating the agent's research stages rather than streaming raw agent logs. This maintains a clean and premium user experience, avoiding cluttering the UI with noisy agent traces.

---

## What We Would Improve With More Time

1. **Streaming Agent Thoughts**: Implement real-time WebSockets or Server-Sent Events (SSE) to show the exact search queries the agent is running in a terminal-like drawer.
2. **Interactive Chat**: Add an interactive chat panel below the report allowing the user to ask follow-up questions to the agent (e.g. "Explain why you think the P/E ratio is high").
3. **PDF Export**: Add a button to download the synthesized report as a PDF.
4. **Compare Companies**: Allow users to select two companies from the history sidebar and display a side-by-side comparison matrix.

---

## Example Runs

### Case 1: NVIDIA (NVDA)
* **Decision**: `INVEST`
* **Confidence**: `85%`
* **Summary**: NVIDIA continues to dominate the AI hardware ecosystem with its CUDA platform and H100/H200/Blackwell GPU architectures. Exceptional year-over-year revenue growth and pricing power offsets high valuation multiple concerns.
* **Bull Case**:
  - Uncontested market share (>90%) in enterprise AI training accelerators.
  - CUDA software ecosystem creates high customer lock-in/moat.
  - Generative AI infrastructure buildout shows no signs of slowing down.
* **Bear Case**:
  - Valuation is priced for perfection (high forward P/E).
  - Geopolitical risks surrounding chip exports and Taiwan fabrication (TSMC dependency).
  - Emergence of custom ASICs by hyperscalers (Google TPU, AWS Trainium).

### Case 2: GameStop (GME)
* **Decision**: `PASS`
* **Confidence**: `90%`
* **Summary**: GameStop remains heavily reliant on legacy physical gaming media distribution, which is in secular decline. Although the company has a strong cash balance from share dilution events, it lacks a coherent growth catalyst to justify its volatile valuation.
* **Bull Case**:
  - Over $4B in cash reserves providing a long runway.
  - Passionate retail shareholder base prevents insolvency risk.
* **Bear Case**:
  - core business model (selling physical discs) is dying as consoles move digital-only.
  - Extremely volatile stock price detached from fundamental valuations.
  - Lack of operational turnaround strategy or high-margin business models.

---

## Bonus: LLM Conversation Transcripts

Since this project was built in cooperation with **Antigravity**, a complete history of our design decisions, research steps, and pair-programming chats is available in the local configuration directories. 

You can find the full untruncated transcript logs detailing our developer interaction at:
`C:\Users\prysh\.gemini\antigravity\brain\10c84022-a364-4d5e-9205-4df2c23855c3\.system_generated\logs\transcript_full.jsonl`
