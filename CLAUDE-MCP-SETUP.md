# Claude MCP Setup For This Technical SEO Audit Server

This project is already generated at:

```text
C:\Users\Admin\Desktop\mcp
```

Use this file when connecting the server to Claude Desktop, Claude Code, Codex, Cursor, or another MCP client.

## Build

```powershell
cd C:\Users\Admin\Desktop\mcp
npm install
npm run build
```

The server entrypoint is:

```text
C:\Users\Admin\Desktop\mcp\dist\server.js
```

## Optional API Keys

Use environment variables only:

```env
SEOSCORE_API_KEY=
PSI_API_KEY=
SEMRUSH_API_KEY=
SEMRUSH_API_ENDPOINT=https://api-semrush.groupbuyseo.org/
SEMRUSH_DATABASE=us
TECHNICAL_AUDIT_TIMEOUT_MS=30000
TECHNICAL_AUDIT_USER_AGENT=TechnicalSeoAuditMcp/1.0
```

Do not commit `.env`.

## Claude Desktop Config

Edit:

```text
%APPDATA%\Claude\claude_desktop_config.json
```

Use:

```json
{
  "mcpServers": {
    "technical-seo-audit": {
      "command": "node",
      "args": [
        "C:\\Users\\Admin\\Desktop\\mcp\\dist\\server.js"
      ],
      "env": {
        "SEOSCORE_API_KEY": "",
        "PSI_API_KEY": "",
        "SEMRUSH_API_KEY": "",
        "SEMRUSH_API_ENDPOINT": "https://api-semrush.groupbuyseo.org/",
        "SEMRUSH_DATABASE": "us"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

## Available Tool

This MCP server registers only:

- `technical_seo_audit`

The audit includes status labels, sitemap URL inventory, robots/indexability checks, mobile viewport checks, image ALT checks, and a Word-compatible document payload.

## Test Prompts

```text
What MCP tools are available?
```

```text
Run a technical SEO audit for https://example.com and summarize critical issues.
```

## If It Does Not Work

- Install Node.js 20+ if `node` or `npm` is missing.
- Run `npm install` if modules are missing.
- Run `npm run build` if `dist/server.js` is missing.
- Use an absolute path in the MCP config.
- Fully restart Claude Desktop after config changes.
- Verify `SEOSCORE_API_KEY`, `PSI_API_KEY`, or `SEMRUSH_API_KEY` if optional API checks fail.
