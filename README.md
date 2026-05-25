# Technical SEO Audit MCP Server

Focused MCP server for technical SEO audits only.

## What It Exposes

- `technical_seo_audit`: audits one public URL and returns a multi-part technical SEO report:
  - indexability and crawlability
  - on-page SEO analysis
  - performance and mobile SEO
  - structured data and analytics
  - Semrush-compatible visibility when configured
  - sitemap URL inventory with sampled broken/non-canonical/noindex checks
  - Word-compatible HTML document output

The project intentionally exposes no separate keyword research, SERP analysis, backlinks, competitor, or rank-tracking tools.

## Verification Sources

The tool always checks public crawl-visible signals first:

- `robots.txt`
- XML sitemap locations
- target page HTML
- HTTP status and redirects
- title, description, headings, canonicals, schema, images, links, analytics tags, and social profile links
- custom 404 behavior

Optional API verification is used when keys are configured:

- `SEOSCORE_API_KEY`: SEO Score API first-pass audit summary
- `PSI_API_KEY`: Google PageSpeed Insights mobile and desktop verification
- `SEMRUSH_API_KEY`: Semrush-compatible Domain Ranks verification
- `SEMRUSH_API_ENDPOINT`: Semrush-compatible endpoint, defaults to `https://api-semrush.groupbuyseo.org/`
- `SEMRUSH_DATABASE`: Semrush regional database, defaults to `us`

Unavailable metrics are reported as unverified instead of estimated.

## Environment

Set optional API keys in `.env` locally or in your deployment environment:

```env
SEOSCORE_API_KEY=
PSI_API_KEY=
SEMRUSH_API_KEY=
SEMRUSH_API_ENDPOINT=https://api-semrush.groupbuyseo.org/
SEMRUSH_DATABASE=us
TECHNICAL_AUDIT_TIMEOUT_MS=30000
TECHNICAL_AUDIT_USER_AGENT=TechnicalSeoAuditMcp/1.0
LOG_LEVEL=info
MCP_AUTH_MODE=none
MCP_AUTH_TOKEN=
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
Run a full technical SEO audit for https://example.com.

Validate crawlability, indexability signals, metadata, canonicals, structured data,
performance, mobile usability, broken-link limitations, and analytics setup.
```

Optional input:

```json
{
  "include_word_document": true
}
```

## Security Notes

- Keep `.env` out of git.
- Do not hardcode API keys in source files.
- Do not paste real API keys into chat.
- Rotate credentials if they are exposed.
