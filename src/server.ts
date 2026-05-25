#!/usr/bin/env node
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./createServer.js";
import { getEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";

const fallbackHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Shivani MCP Server</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #f7f3ec 0%, #eef5f2 100%);
        color: #1f2933;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(920px, calc(100vw - 32px));
        padding: clamp(32px, 8vw, 72px);
        border: 1px solid #d9cfc0;
        border-radius: 8px;
        background: rgba(255, 253, 248, 0.9);
        box-shadow: 0 24px 80px rgba(31, 41, 51, 0.12);
      }
      h1 {
        margin: 0;
        max-width: 760px;
        font-size: clamp(40px, 7vw, 76px);
        line-height: 0.98;
        letter-spacing: 0;
      }
      p {
        max-width: 620px;
        margin: 24px 0 0;
        color: #56616d;
        font-size: clamp(16px, 2vw, 20px);
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Welcome to Shivani MCP Server</h1>
      <p>This deployment is online. Use /mcp for MCP clients and /health for health checks.</p>
    </main>
  </body>
</html>`;

export async function startStdioServer(): Promise<void> {
  getEnv();
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("DataForSEO MCP server started over stdio");
}

export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  res.statusCode = 200;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(fallbackHtml);
}

function isDirectRun(): boolean {
  if (!process.argv[1]) return false;
  return import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
}

if (isDirectRun()) {
  startStdioServer().catch((error) => {
    logger.fatal({ error }, "DataForSEO MCP server failed to start");
    process.exit(1);
  });
}
