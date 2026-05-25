import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataForSeoClient } from "./services/dataforseoClient.js";
import { registerOnPageAnalysisTool } from "./tools/onPageAnalysis.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "technical-seo-audit-mcp",
    version: "1.0.0"
  });

  const client = new DataForSeoClient();

  registerOnPageAnalysisTool(server, client);

  return server;
}
