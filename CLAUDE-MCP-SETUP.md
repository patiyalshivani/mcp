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

## Credentials

Use environment variables only:

```env
DATAFORSEO_LOGIN=your-login
DATAFORSEO_PASSWORD=your-password
DATAFORSEO_BASE_URL=https://api.dataforseo.com
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
        "DATAFORSEO_LOGIN": "your-login",
        "DATAFORSEO_PASSWORD": "your-password",
        "DATAFORSEO_BASE_URL": "https://api.dataforseo.com"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

## Available Tool

This MCP server registers only:

- `technical_seo_audit`

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
- Verify DataForSEO credentials if authentication fails.
