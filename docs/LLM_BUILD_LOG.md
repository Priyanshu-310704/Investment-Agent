# LLM Build Log

This document summarizes the LLM-assisted build process for the Investment Research Workbench assignment. Sensitive values such as API keys, database URLs, and local-only environment data are intentionally excluded.

## Session Context

- Project: InsideIIM / Altuni AI Labs investment research agent.
- Stack: Next.js App Router, React, TypeScript, Groq, LangGraph, DuckDuckGo search, Neon Postgres.
- Goal: Build a deployable AI research agent that can search for company information, produce a structured investment recommendation, persist reports, and display them in a clean dashboard.

## User Requirements Captured

- Improve shallow research into a deeper multi-factor analysis.
- Include business, financial, development, valuation, risk, market, and governance/sentiment factors.
- Make the UI clean, white, neon-accented, and not obviously AI-generated.
- Add more content, graphs, charts, and visible detail so users do not feel analysis is hidden.
- Keep the codebase well managed with separate files and components.
- Use the existing `investment-agent` Git repository.
- Prepare assignment documentation and a zip package with all necessary files.
- Include an LLM chat/session log for bonus credit.

## Key LLM-Assisted Decisions

1. Keep Next.js App Router for routing and API endpoints, but move reusable UI into components.
2. Use `components/report` for report-only widgets so `app/page.tsx` stays readable.
3. Replace the older bull/bear-only schema with a flexible `factors` array.
4. Add `investment_thesis` and `watch_items` to make the report more complete.
5. Normalize agent output in `lib/report-utils.ts` so the UI is protected from malformed or partial LLM JSON.
6. Harden Neon schema initialization with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
7. Exclude `.env.local`, `.next`, `node_modules`, and `.git` from the submission zip.

## Implementation Log

### Research Depth

The original prompt focused on a smaller set of factors. The LLM-assisted revision expanded the agent prompt to require at least five searches and cover seven areas:

- Business quality
- Financial health
- Valuation discipline
- Development pipeline
- Market position
- Risk control
- Sentiment and governance

The report now asks for scores, evidence points, implications, thesis bullets, watch items, metrics, and source URLs.

### UI And Components

The previous UI had excess whitespace and a less professional dashboard feel. The LLM-assisted revision compacted the hero, search card, empty state, report panels, and sidebar. The report display was split into focused widgets:

- `ReportHero`
- `InsightList`
- `FactorRadar`
- `FactorBarChart`
- `FactorGrid`
- `FactorCard`
- `MetricsTable`
- `SourcesList`

### Database And Runtime Reliability

The schema was adjusted so future report factors can be stored without creating a new database column for every factor. Existing legacy columns are still tolerated during history loading.

The research API route duration was increased to support deeper multi-step research runs.

### Packaging And Documentation

The README was rewritten to include:

- Overview
- How to run
- Environment variables
- Architecture
- Key decisions and trade-offs
- Example runs
- Future improvements
- LLM build log reference
- Submission package notes

## Verification Performed

The production build was run successfully:

```bash
npm run build
```

The local app was smoke-tested in the browser at:

```text
http://localhost:3000
```

Checks performed:

- Page loaded successfully.
- Search input appeared.
- Empty report state appeared.
- No corrupted text was visible.
- No browser console errors were observed during the smoke check.
- No horizontal overflow was detected in the tested desktop viewport.

## Notes For Reviewers

The project requires real environment variables to run the live agent flow. Without `GROQ_API_KEY` and `DATABASE_URL`, the app can build and load, but research generation and persistence will fail at runtime.

The example runs in the README are representative because the agent searches live public information and output may change over time.
