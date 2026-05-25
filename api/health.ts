import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  res.statusCode = 200;
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET, OPTIONS");
  res.setHeader("access-control-allow-headers", "authorization, content-type, accept");
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({
    status: "ok",
    nodeVersion: process.version,
    env: {
      hasLogin: Boolean(process.env.DATAFORSEO_LOGIN),
      hasPassword: Boolean(process.env.DATAFORSEO_PASSWORD),
      hasToken: Boolean(process.env.MCP_AUTH_TOKEN)
    }
  }));
}
