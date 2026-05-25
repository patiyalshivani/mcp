import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  const authMode = process.env.MCP_AUTH_MODE?.toLowerCase();
  const normalizedAuthMode =
    authMode === "none" || authMode === "noauth" || authMode === "public"
      ? "none"
      : process.env.MCP_AUTH_TOKEN
        ? "token"
        : "none";

  res.statusCode = 200;
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET, OPTIONS");
  res.setHeader("access-control-allow-headers", "authorization, content-type, accept");
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({
    status: "ok",
    nodeVersion: process.version,
    env: {
      hasSeoScoreKey: Boolean(process.env.SEOSCORE_API_KEY),
      hasPsiKey: Boolean(process.env.PSI_API_KEY),
      hasSemrushKey: Boolean(process.env.SEMRUSH_API_KEY),
      hasToken: Boolean(process.env.MCP_AUTH_TOKEN),
      authMode: normalizedAuthMode
    }
  }));
}
