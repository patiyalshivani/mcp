import type { IncomingMessage, ServerResponse } from "node:http";

function setCommonHeaders(res: ServerResponse): void {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "access-control-allow-headers",
    "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id"
  );
  res.setHeader("access-control-expose-headers", "mcp-session-id");
}

function isAuthorized(req: IncomingMessage): boolean {
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
  return typeof accept === "string" && !accept.includes("text/event-stream");
}

function redirectToHome(res: ServerResponse): void {
  res.statusCode = 307;
  setCommonHeaders(res);
  res.setHeader("location", "/");
  res.end();
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    setCommonHeaders(res);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }

    if (req.method === "GET" && req.url?.includes("/health")) {
      const hasLogin = Boolean(process.env.DATAFORSEO_LOGIN);
      const hasPassword = Boolean(process.env.DATAFORSEO_PASSWORD);
      const hasToken = Boolean(process.env.MCP_AUTH_TOKEN);
      return sendJson(res, 200, {
        status: "ok",
        nodeVersion: process.version,
        env: { hasLogin, hasPassword, hasToken }
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
