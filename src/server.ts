#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./createServer.js";
import { getEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  getEnv();
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("DataForSEO MCP server started over stdio");
}

main().catch((error) => {
  logger.fatal({ error }, "DataForSEO MCP server failed to start");
  process.exit(1);
});
