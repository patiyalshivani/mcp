import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataForSeoClient } from "./services/dataforseoClient.js";
import { registerKeywordResearchTool } from "./tools/keywordResearch.js";
import { registerSerpAnalysisTool } from "./tools/serpAnalysis.js";
import { registerOnPageAnalysisTool } from "./tools/onPageAnalysis.js";
import { registerBacklinksAnalysisTool } from "./tools/backlinks.js";
import { registerCompetitorsAnalysisTool } from "./tools/competitors.js";
import { registerRankingsTool } from "./tools/rankings.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "dataforseo-mcp",
    version: "1.0.0"
  });

  const client = new DataForSeoClient();

  registerKeywordResearchTool(server, client);
  registerSerpAnalysisTool(server, client);
  registerOnPageAnalysisTool(server, client);
  registerBacklinksAnalysisTool(server, client);
  registerCompetitorsAnalysisTool(server, client);
  registerRankingsTool(server, client);

  return server;
}
