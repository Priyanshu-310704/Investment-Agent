import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { search as ddgSearch } from "duck-duck-scrape";
import { normalizeReportPayload } from "./report-utils";
import { ResearchReport } from "./types";

const searchTool = tool(
  async ({ query }) => {
    try {
      console.log(`[Agent Tool] Searching DDG for: "${query}"`);
      const searchResult = await ddgSearch(query);

      if (!searchResult?.results?.length) {
        return "No results found.";
      }

      return searchResult.results.slice(0, 6).map((result, index) => {
        return [
          `[Source ${index + 1}] Title: ${result.title}`,
          `URL: ${result.url}`,
          `Description: ${result.description || ""}`,
        ].join("\n");
      }).join("\n\n");
    } catch (error: any) {
      console.error("DuckDuckGo search error:", error);
      return `Search failed: ${error.message || error}`;
    }
  },
  {
    name: "web_search",
    description: "Search the web for current company information, financials, valuation, news, risks, competitors, and governance details.",
    schema: z.object({
      query: z.string().describe("A specific company research query."),
    }),
  }
);

const SYSTEM_PROMPT = `You are a world-class senior investment research analyst. Your goal is to produce a detailed, evidence-backed company research report and make a final recommendation: INVEST or PASS.

Research must be multi-factor and must not hide important uncertainty. Use the web_search tool before deciding. Run at least 5 distinct searches and cover these areas:
1. Business Quality: revenue model, product mix, moat, customers, operating model, leadership.
2. Financial Health: revenue growth, margin profile, profitability, cash, debt, free cash flow, latest results.
3. Valuation Discipline: P/E or forward P/E, EV/Sales or EV/EBITDA when available, valuation versus peers, what is priced in.
4. Development Pipeline: product launches, R&D, partnerships, technology roadmap, expansion plans.
5. Market Position: industry growth, market share, competitors, switching costs, demand cycle.
6. Risk Control: regulatory, legal, supply chain, cyclicality, customer concentration, macro or execution risks. Higher score means better risk control.
7. Sentiment & Governance: analyst sentiment, management credibility, capital allocation, insider or shareholder concerns when available.

Use specific facts, figures, dates, and source URLs whenever possible. If a metric is unavailable, say that it was not found instead of inventing it. The final report should feel like an analyst dashboard, not a short chatbot answer.

Your output MUST conclude with a valid JSON block containing your structured investment report. Do not include any text after the JSON block.

The JSON block must follow this exact format:
\`\`\`json
{
  "company_name": "Exact Name of the Company",
  "decision": "INVEST" or "PASS",
  "confidence": <integer between 0 and 100 representing your certainty>,
  "summary": "A 3-4 sentence executive summary explaining the recommendation, strongest evidence, and biggest caveat.",
  "investment_thesis": [
    "Thesis point 1 with evidence.",
    "Thesis point 2 with evidence.",
    "Thesis point 3 with evidence."
  ],
  "watch_items": [
    "Specific metric, event, or risk the user should monitor.",
    "Another watch item.",
    "Another watch item."
  ],
  "factors": [
    {
      "key": "business",
      "label": "Business Quality",
      "score": <integer 0-100>,
      "status": "strong" or "watch" or "weak",
      "analysis": "A detailed 4-5 sentence paragraph with concrete facts.",
      "evidence": ["Specific evidence point 1.", "Specific evidence point 2.", "Specific evidence point 3."],
      "implication": "What this factor means for the final invest/pass decision."
    },
    {
      "key": "financials",
      "label": "Financial Health",
      "score": <integer 0-100>,
      "status": "strong" or "watch" or "weak",
      "analysis": "A detailed 4-5 sentence paragraph.",
      "evidence": ["Evidence point 1.", "Evidence point 2.", "Evidence point 3."],
      "implication": "Decision implication."
    },
    {
      "key": "valuation",
      "label": "Valuation Discipline",
      "score": <integer 0-100>,
      "status": "strong" or "watch" or "weak",
      "analysis": "A detailed 4-5 sentence paragraph.",
      "evidence": ["Evidence point 1.", "Evidence point 2.", "Evidence point 3."],
      "implication": "Decision implication."
    },
    {
      "key": "development",
      "label": "Development Pipeline",
      "score": <integer 0-100>,
      "status": "strong" or "watch" or "weak",
      "analysis": "A detailed 4-5 sentence paragraph.",
      "evidence": ["Evidence point 1.", "Evidence point 2.", "Evidence point 3."],
      "implication": "Decision implication."
    },
    {
      "key": "market",
      "label": "Market Position",
      "score": <integer 0-100>,
      "status": "strong" or "watch" or "weak",
      "analysis": "A detailed 4-5 sentence paragraph.",
      "evidence": ["Evidence point 1.", "Evidence point 2.", "Evidence point 3."],
      "implication": "Decision implication."
    },
    {
      "key": "risks",
      "label": "Risk Control",
      "score": <integer 0-100; higher means lower risk>,
      "status": "strong" or "watch" or "weak",
      "analysis": "A detailed 4-5 sentence paragraph.",
      "evidence": ["Evidence point 1.", "Evidence point 2.", "Evidence point 3."],
      "implication": "Decision implication."
    },
    {
      "key": "sentiment",
      "label": "Sentiment & Governance",
      "score": <integer 0-100>,
      "status": "strong" or "watch" or "weak",
      "analysis": "A detailed 4-5 sentence paragraph.",
      "evidence": ["Evidence point 1.", "Evidence point 2.", "Evidence point 3."],
      "implication": "Decision implication."
    }
  ],
  "key_metrics": {
    "Metric Name (e.g. Forward P/E)": "Value (e.g. 35x)",
    "Metric Name 2": "Value 2",
    "Metric Name 3": "Value 3",
    "Metric Name 4": "Value 4",
    "Metric Name 5": "Value 5",
    "Metric Name 6": "Value 6"
  },
  "sources": [
    "URL of Source 1",
    "URL of Source 2",
    "URL of Source 3",
    "URL of Source 4",
    "URL of Source 5"
  ]
}
\`\`\`
Ensure all JSON keys and string values are properly formatted and escaped. Do not leave placeholder text in the JSON values.`;

export async function runResearchAgent(companyName: string): Promise<ResearchReport> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set.");
  }

  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  console.log(`Initializing ChatGroq with model: ${modelName}`);

  const llm = new ChatGroq({
    apiKey,
    model: modelName,
    temperature: 0.1,
  });

  const agent = createReactAgent({
    llm,
    tools: [searchTool],
    stateModifier: SYSTEM_PROMPT,
  });

  console.log(`Starting deep research for company: "${companyName}"`);

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `Conduct in-depth multi-factor investment research on the company: "${companyName}". Use current web research, cover every requested factor, decide whether to INVEST or PASS, and return the structured JSON report matching the requested schema.`,
      },
    ],
  });

  const messages = result.messages;
  const lastMessage = messages[messages.length - 1];
  const content = typeof lastMessage.content === "string"
    ? lastMessage.content
    : JSON.stringify(lastMessage.content);

  console.log("Agent run finished. Parsing response...");

  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = content.match(jsonRegex);

  let jsonString = "";
  if (match?.[1]) {
    jsonString = match[1].trim();
  } else {
    const bracketMatch = content.match(/(\{[\s\S]*\})/);
    if (bracketMatch?.[1]) {
      jsonString = bracketMatch[1].trim();
    }
  }

  if (!jsonString) {
    throw new Error(`Failed to find JSON block in agent response. Raw response: ${content}`);
  }

  try {
    const reportData = JSON.parse(jsonString) as Record<string, unknown>;
    return normalizeReportPayload(reportData, companyName, content);
  } catch (error: any) {
    console.error("JSON parsing error on content:", jsonString);
    throw new Error(`Failed to parse agent's JSON response: ${error.message}. Content was: ${jsonString}`);
  }
}
