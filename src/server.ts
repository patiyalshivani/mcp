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

const commonHeaderEntries = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id",
  "access-control-expose-headers": "mcp-session-id"
};

export async function startStdioServer(): Promise<void> {
  getEnv();
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("DataForSEO MCP server started over stdio");
}

function setCommonHeaders(res: ServerResponse): void {
  for (const [name, value] of Object.entries(commonHeaderEntries)) {
    res.setHeader(name, value);
  }
}

function getAuthMode(): "none" | "token" {
  const mode = process.env.MCP_AUTH_MODE?.toLowerCase();
  if (mode === "none" || mode === "noauth" || mode === "public") return "none";
  return process.env.MCP_AUTH_TOKEN ? "token" : "none";
}

function isAuthorized(req: IncomingMessage): boolean {
  if (getAuthMode() === "none") return true;
  const expected = process.env.MCP_AUTH_TOKEN;
  if (!expected) return false;
  const header = req.headers.authorization;
  if (typeof header !== "string") return false;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return Boolean(match && match[1] === expected);
}

function isBrowserGet(req: IncomingMessage): boolean {
  if (req.method !== "GET") return false;
  const accept = req.headers.accept;
  return typeof accept === "string" && accept.includes("text/html");
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return await new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolvePromise(undefined);
      try {
        resolvePromise(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  setCommonHeaders(res);
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

function sendHome(res: ServerResponse): void {
  res.statusCode = 200;
  setCommonHeaders(res);
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(fallbackHtml);
}

function redirectHome(res: ServerResponse): void {
  res.statusCode = 307;
  setCommonHeaders(res);
  res.setHeader("location", "/");
  res.end();
}

function isMcpPath(url: string | undefined): boolean {
  if (!url) return false;
  const pathname = new URL(url, "https://internal.local").pathname;
  return pathname === "/mcp" || pathname === "/api/mcp";
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    setCommonHeaders(res);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === "GET" && req.url?.startsWith("/health")) {
      return sendJson(res, 200, {
        status: "ok",
        nodeVersion: process.version,
        env: {
          hasLogin: Boolean(process.env.DATAFORSEO_LOGIN),
          hasPassword: Boolean(process.env.DATAFORSEO_PASSWORD),
          hasToken: Boolean(process.env.MCP_AUTH_TOKEN),
          authMode: getAuthMode()
        }
      });
    }

    if (!isMcpPath(req.url)) {
      return sendHome(res);
    }

    if (isBrowserGet(req)) {
      return redirectHome(res);
    }

    if (!isAuthorized(req)) {
      res.setHeader("www-authenticate", "Bearer");
      return sendJson(res, 401, { error: "unauthorized" });
    }

    const body = req.method === "POST" ? await readBody(req) : undefined;
    const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
    const mcpServer = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    await mcpServer.connect(transport);

    res.on("close", () => {
      transport.close().catch(() => undefined);
      mcpServer.close().catch(() => undefined);
    });

    await transport.handleRequest(req, res, body);
  } catch (err) {
    logger.error({ err }, "HTTP MCP handler crashed");
    if (!res.headersSent) {
      sendJson(res, 500, {
        error: "handler_crashed",
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }
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
