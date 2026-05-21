# DataForSEO MCP Server

Production-oriented MCP server that exposes DataForSEO APIs as reusable tools for Claude Code, Claude Desktop, OpenAI Codex CLI, Cursor, VS Code Agent Mode, and other MCP-compatible agents.

## Features

- Secure DataForSEO authentication via environment variables
- Stdio MCP transport
- Strongly typed TypeScript tools
- Zod input validation
- Axios request wrapper with interceptors
- Retry logic with exponential backoff and jitter
- Rate limiting and concurrency control
- In-memory cache and request deduplication
- Safe pino logging to stderr
- Normalized tool responses

## Tools

- `keyword_research`: search volume, CPC, competition, difficulty, and intent signals
- `serp_analysis`: live Google organic SERP results, features, and rankings
- `onpage_analysis`: URL-level title, headings, schema, links, status, and metrics
- `backlinks_analysis`: backlink summary, referring domains, anchors, and toxicity signals where available
- `competitors_analysis`: organic competitor domains and visibility comparison
- `ranked_keywords`: keywords a domain ranks for

## Installation

```bash
cd dataforseo-mcp
npm install
```

## Environment Setup

Copy the example file:

```bash
cp .env.example .env
```

Set your DataForSEO credentials:

```env
DATAFORSEO_LOGIN=your-login
DATAFORSEO_PASSWORD=your-password
DATAFORSEO_BASE_URL=https://api.dataforseo.com
DATAFORSEO_TIMEOUT_MS=30000
DATAFORSEO_RATE_LIMIT_PER_SECOND=3
DATAFORSEO_MAX_CONCURRENCY=5
DATAFORSEO_CACHE_TTL_SECONDS=3600
LOG_LEVEL=info
```

Secrets are never hardcoded and are redacted from logs.

## Build And Run

```bash
npm run build
npm start
```

The server can start without credentials so MCP clients can discover tools, but API calls require `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`.

For development:

```bash
npm run dev
```

## MCP Configuration

For a shorter local setup guide tailored to this machine, see
[`CLAUDE-MCP-SETUP.md`](./CLAUDE-MCP-SETUP.md).

Use an absolute path in real clients:

```json
{
  "mcpServers": {
    "dataforseo": {
      "command": "node",
      "args": ["C:/Users/sharm/OneDrive/Desktop/mcp/dataforseo-mcp/dist/server.js"],
      "env": {
        "DATAFORSEO_LOGIN": "your-login",
        "DATAFORSEO_PASSWORD": "your-password",
        "DATAFORSEO_BASE_URL": "https://api.dataforseo.com"
      }
    }
  }
}
```

The included `mcp-config.json` contains the minimal relative-path example:

```json
{
  "mcpServers": {
    "dataforseo": {
      "command": "node",
      "args": ["dist/server.js"]
    }
  }
}
```

## Claude Desktop Setup

1. Run `npm install && npm run build`.
2. Open Claude Desktop MCP configuration.
3. Add the `dataforseo` server config with an absolute `dist/server.js` path.
4. Add credentials under `env`.
5. Restart Claude Desktop.

## Claude Code Setup

Add this server to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "dataforseo": {
      "command": "node",
      "args": ["C:/Users/sharm/OneDrive/Desktop/mcp/dataforseo-mcp/dist/server.js"],
      "env": {
        "DATAFORSEO_LOGIN": "your-login",
        "DATAFORSEO_PASSWORD": "your-password"
      }
    }
  }
}
```

## OpenAI Codex CLI Setup

Use the same MCP server definition in the Codex MCP configuration location supported by your CLI version. Keep credentials in environment variables or the MCP `env` block.

## Cursor Setup

1. Open Cursor settings for MCP servers.
2. Add a server named `dataforseo`.
3. Set command to `node`.
4. Set args to the absolute path of `dist/server.js`.
5. Add the DataForSEO environment variables.

## VS Code Agent Mode Setup

Configure an MCP server entry with:

```json
{
  "name": "dataforseo",
  "command": "node",
  "args": ["C:/Users/sharm/OneDrive/Desktop/mcp/dataforseo-mcp/dist/server.js"]
}
```

Pass credentials through the environment.

## Example Prompts

```text
Use DataForSEO to research the keyword "seo audit tool" in the United States.
```

```text
Analyze the Google SERP for "best seo tools" and summarize the top competitors.
```

```text
Run on-page analysis for https://example.com and identify technical SEO issues.
```

```text
Analyze backlinks for example.com and summarize referring domains and anchor text.
```

```text
Find organic competitors for example.com in the United States.
```

## Troubleshooting

- `DATAFORSEO_LOGIN is required`: set credentials in `.env` or the MCP client `env` block.
- `authentication failed`: verify DataForSEO login/password and account access.
- `rate limit exceeded`: reduce `DATAFORSEO_RATE_LIMIT_PER_SECOND` and `DATAFORSEO_MAX_CONCURRENCY`.
- `request timed out`: increase `DATAFORSEO_TIMEOUT_MS`.
- No logs in client: logs go to stderr so stdout remains reserved for MCP protocol messages.

## Security Notes

- Never commit `.env`.
- Do not log credentials.
- Prefer per-client environment injection for shared machines.
- Rotate DataForSEO credentials if they are exposed.

## Architecture

```text
src/
  server.ts
  tools/
  services/
  schemas/
  utils/
  config/
```

The design keeps MCP registration, validation schemas, API access, retry, cache, rate limiting, and logging separate so future SEO APIs can be added without changing existing tools.
