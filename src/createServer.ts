import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTechnicalSeoAuditTool } from "./tools/technicalSeoAudit.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "technical-seo-audit-mcp",
    version: "1.0.0"
  });

  registerTechnicalSeoAuditTool(server);

  return server;
}
