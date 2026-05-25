import type { IncomingMessage, ServerResponse } from "node:http";

const commonHeaderEntries = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id",
  "access-control-expose-headers": "mcp-session-id"
};

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
  const header = req.headers["authorization"];
  if (typeof header !== "string") return false;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  return match[1] === expected;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch (err) { reject(err); }
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

function isBrowserGet(req: IncomingMessage): boolean {
  if (req.method !== "GET") return false;
  const accept = req.headers.accept;
  return typeof accept === "string" && accept.includes("text/html");
}

function redirectToHome(res: ServerResponse): void {
  res.statusCode = 307;
  setCommonHeaders(res);
  res.setHeader("location", "/");
  res.end();
}

function commonHeaders(): Headers {
  return new Headers(commonHeaderEntries);
}

function jsonResponse(status: number, body: unknown): Response {
  const headers = commonHeaders();
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

function isAuthorizedRequest(request: Request): boolean {
  if (getAuthMode() === "none") return true;
  const expected = process.env.MCP_AUTH_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization");
  if (!header) return false;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return Boolean(match && match[1] === expected);
}

function isBrowserRequest(request: Request): boolean {
  const accept = request.headers.get("accept");
  return request.method === "GET" && Boolean(accept?.includes("text/html"));
}

function withCommonHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(commonHeaderEntries)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function handleWebRequest(request: Request): Promise<Response> {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: commonHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname.endsWith("/health")) {
      return jsonResponse(200, {
        status: "ok",
        nodeVersion: process.version,
        env: {
          hasSeoScoreKey: Boolean(process.env.SEOSCORE_API_KEY),
          hasPsiKey: Boolean(process.env.PSI_API_KEY),
          hasSemrushKey: Boolean(process.env.SEMRUSH_API_KEY),
          hasToken: Boolean(process.env.MCP_AUTH_TOKEN),
          authMode: getAuthMode()
        }
      });
    }

    if (isBrowserRequest(request)) {
      const headers = commonHeaders();
      headers.set("location", "/");
      return new Response(null, { status: 307, headers });
    }

    if (!isAuthorizedRequest(request)) {
      const headers = commonHeaders();
      headers.set("content-type", "application/json");
      headers.set("www-authenticate", "Bearer");
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });
    }

    const [{ WebStandardStreamableHTTPServerTransport }, { createServer }] = await Promise.all([
      import("@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"),
      import("../dist/createServer.js")
    ]);

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });
    const server = createServer();
    await server.connect(transport);

    const response = await transport.handleRequest(request);
    return withCommonHeaders(response);
  } catch (err) {
    console.error("[api/mcp] web handler crashed:", err);
    return jsonResponse(500, {
      error: "handler_crashed",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    setCommonHeaders(res);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }

    if (req.method === "GET" && req.url?.includes("/health")) {
      const hasSeoScoreKey = Boolean(process.env.SEOSCORE_API_KEY);
      const hasPsiKey = Boolean(process.env.PSI_API_KEY);
      const hasSemrushKey = Boolean(process.env.SEMRUSH_API_KEY);
      const hasToken = Boolean(process.env.MCP_AUTH_TOKEN);
      return sendJson(res, 200, {
        status: "ok",
        nodeVersion: process.version,
        env: { hasSeoScoreKey, hasPsiKey, hasSemrushKey, hasToken, authMode: getAuthMode() }
      });
    }

    if (isBrowserGet(req)) {
      return redirectToHome(res);
    }

    if (!isAuthorized(req)) {
      res.setHeader("www-authenticate", "Bearer");
      return sendJson(res, 401, { error: "unauthorized" });
    }

    const body = req.method === "POST" ? await readBody(req) : undefined;
    const [{ StreamableHTTPServerTransport }, { createServer }] = await Promise.all([
      import("@modelcontextprotocol/sdk/server/streamableHttp.js"),
      import("../dist/createServer.js")
    ]);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });
    const server = createServer();
    await server.connect(transport);

    res.on("close", () => {
      transport.close().catch(() => undefined);
      server.close().catch(() => undefined);
    });

    await transport.handleRequest(req, res, body);
  } catch (err) {
    console.error("[api/mcp] handler crashed:", err);
    if (!res.headersSent) {
      sendJson(res, 500, {
        error: "handler_crashed",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
    }
  }
}

export const GET = handleWebRequest;
export const POST = handleWebRequest;
export const DELETE = handleWebRequest;
export const OPTIONS = handleWebRequest;
