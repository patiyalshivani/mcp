import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  res.statusCode = 307;
  res.setHeader("location", "/");
  res.end();
}
