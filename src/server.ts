#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DataForSeoClient } from "./services/dataforseoClient.js";
import { getEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { registerKeywordResearchTool } from "./tools/keywordResearch.js";
import { registerSerpAnalysisTool } from "./tools/serpAnalysis.js";
import { registerOnPageAnalysisTool } from "./tools/onPageAnalysis.js";
import { registerBacklinksAnalysisTool } from "./tools/backlinks.js";
import { registerCompetitorsAnalysisTool } from "./tools/competitors.js";
import { registerRankingsTool } from "./tools/rankings.js";

async function main(): Promise<void> {
  getEnv();

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

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("DataForSEO MCP server started over stdio");
}

main().catch((error) => {
  logger.fatal({ error }, "DataForSEO MCP server failed to start");
  process.exit(1);
});
