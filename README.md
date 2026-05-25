# Technical SEO Audit MCP Server

Focused MCP server for technical SEO audits powered by DataForSEO OnPage Instant Pages.

## What It Exposes

- `technical_seo_audit`: audits one URL and returns HTTP status, title, meta description, headings, schema, link counts, DataForSEO checks, and page metrics.

The project intentionally exposes technical audit functionality only. Keyword research, SERP analysis, backlinks, competitor analysis, and rankings tools are not registered.

## Environment

Set DataForSEO credentials in `.env` locally or in your deployment environment:

```env
DATAFORSEO_LOGIN=your-login
DATAFORSEO_PASSWORD=your-password
DATAFORSEO_BASE_URL=https://api.dataforseo.com
DATAFORSEO_TIMEOUT_MS=30000
DATAFORSEO_RATE_LIMIT_PER_SECOND=3
DATAFORSEO_MAX_CONCURRENCY=5
DATAFORSEO_CACHE_TTL_SECONDS=3600
LOG_LEVEL=info
MCP_AUTH_MODE=none
```

For ChatGPT custom MCP connectors, use `MCP_AUTH_MODE=none` unless you add OAuth. For private token-based clients, set `MCP_AUTH_MODE=token` and `MCP_AUTH_TOKEN`.

## Build And Run

```bash
npm install
npm run build
npm start
```

## MCP Endpoints

For Vercel or another HTTP deployment:

```text
/mcp
/health
```

For local stdio clients:

```json
{
  "mcpServers": {
    "technical-seo-audit": {
      "command": "node",
      "args": ["dist/server.js"]
    }
  }
}
```

## Example Prompt

```text
Run a technical SEO audit for https://example.com and summarize the most important issues.
```

## Security Notes

- Keep `.env` out of git.
- Do not hardcode DataForSEO credentials in source files.
- Rotate credentials if they are exposed.
