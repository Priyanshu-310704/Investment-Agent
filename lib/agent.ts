import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ResearchReport } from "./types";
import { search as ddgSearch } from "duck-duck-scrape";

// Create custom search tool using duck-duck-scrape
const searchTool = tool(
  async ({ query }) => {
    try {
      console.log(`[Agent Tool] Searching DDG for: "${query}"`);
      const searchResult = await ddgSearch(query);
      if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
        return "No results found.";
      }
      // Return top 5 results as text
      const formattedResults = searchResult.results.slice(0, 5).map((r, index) => {
        return `[Source ${index + 1}] Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description || ''}\n`;
      }).join("\n");
      return formattedResults;
    } catch (error: any) {
      console.error("DuckDuckGo search error:", error);
      return `Search failed: ${error.message || error}`;
    }
  },
  {
    name: "web_search",
    description: "Search the web for current information, financials, news, or details about a company. Input should be a specific search query.",
    schema: z.object({
      query: z.string().describe("The search query to execute"),
    }),
  }
);

const SYSTEM_PROMPT = `You are a senior investment research analyst. Your goal is to research a company and decide whether to INVEST or PASS.
You must conduct thorough research using the web_search tool.

Be diligent. You should search for:
1. The company's business model, latest products/services, and industry position.
2. Recent financial performance, earnings, key metrics (like P/E ratio, revenue growth, profit margins) if available.
3. Market sentiment, recent news, and key catalysts.
4. Major risks, competitive pressures, and potential red flags.

You must perform at least 2 or 3 distinct searches to gather sufficient information before making your decision. Do not rush to a decision.

After you have gathered enough information, synthesize your findings and write a final analysis.
Your final response MUST conclude with a valid JSON block containing your structured investment report. 
Do not include any text after the JSON block.

The JSON block must follow this exact format:
\`\`\`json
{
  "company_name": "Exact Name of the Company",
  "decision": "INVEST" or "PASS",
  "confidence": <integer between 0 and 100 representing your certainty>,
  "summary": "A 2-3 sentence high-level summary of your decision and key findings.",
  "bull_case": [
    "Key reason 1 supporting your decision",
    "Key reason 2 supporting your decision",
    "Key reason 3 supporting your decision"
  ],
  "bear_case": [
    "Key risk/concern 1",
    "Key risk/concern 2",
    "Key risk/concern 3"
  ],
  "key_metrics": {
    "Metric Name (e.g. Revenue Growth)": "Value (e.g. +25% YoY)",
    "Metric Name 2": "Value 2"
  },
  "sources": [
    "URL of Source 1",
    "URL of Source 2"
  ]
}
\`\`\`
Ensure all JSON keys and string values are properly formatted.`;

export async function runResearchAgent(companyName: string): Promise<ResearchReport> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set.");
  }

  // Use the user-defined model or a sensible modern default
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

  console.log(`Starting research for company: "${companyName}"`);
  
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `Conduct investment research on the company: "${companyName}". Decide whether to INVEST or PASS, and return the structured JSON report.`,
      },
    ],
  });

  const messages = result.messages;
  const lastMessage = messages[messages.length - 1];
  const content = typeof lastMessage.content === "string" ? lastMessage.content : JSON.stringify(lastMessage.content);

  console.log("Agent run finished. Parsing response...");

  // Extract the JSON block
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = content.match(jsonRegex);
  
  let jsonString = "";
  if (match && match[1]) {
    jsonString = match[1].trim();
  } else {
    // Try to find raw JSON brackets
    const bracketRegex = /(\{[\s\S]*\})/;
    const bracketMatch = content.match(bracketRegex);
    if (bracketMatch && bracketMatch[1]) {
      jsonString = bracketMatch[1].trim();
    }
  }

  if (!jsonString) {
    throw new Error(`Failed to find JSON block in agent response. Raw response: ${content}`);
  }

  try {
    const reportData = JSON.parse(jsonString);
    
    // Validate required fields
    const validatedReport: ResearchReport = {
      company_name: reportData.company_name || companyName,
      decision: reportData.decision === "INVEST" ? "INVEST" : "PASS",
      confidence: typeof reportData.confidence === "number" ? reportData.confidence : 50,
      summary: reportData.summary || "No summary provided.",
      bull_case: Array.isArray(reportData.bull_case) ? reportData.bull_case : [],
      bear_case: Array.isArray(reportData.bear_case) ? reportData.bear_case : [],
      key_metrics: typeof reportData.key_metrics === "object" && reportData.key_metrics !== null ? reportData.key_metrics : {},
      sources: Array.isArray(reportData.sources) ? reportData.sources : [],
      raw_response: content,
    };

    return validatedReport;
  } catch (error: any) {
    console.error("JSON parsing error on content:", jsonString);
    throw new Error(`Failed to parse agent's JSON response: ${error.message}. Content was: ${jsonString}`);
  }
}
