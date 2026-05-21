# Claude MCP Setup For This DataForSEO Server

This project is already generated at:

```text
C:\Users\sharm\OneDrive\Desktop\mcp\dataforseo-mcp
```

Use this file when connecting the server to Claude Desktop, Claude Code, Codex, Cursor, or another MCP client.

## Build

```powershell
cd C:\Users\sharm\OneDrive\Desktop\mcp\dataforseo-mcp
npm install
npm run build
```

The server entrypoint is:

```text
C:\Users\sharm\OneDrive\Desktop\mcp\dataforseo-mcp\dist\server.js
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
    "dataforseo": {
      "command": "node",
      "args": [
        "C:\\Users\\sharm\\OneDrive\\Desktop\\mcp\\dataforseo-mcp\\dist\\server.js"
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

## Available Tools

This MCP server registers:

- `keyword_research`
- `serp_analysis`
- `onpage_analysis`
- `backlinks_analysis`
- `competitors_analysis`
- `ranked_keywords`

## Test Prompts

```text
What MCP tools are available?
```

```text
Use DataForSEO MCP tools to analyze keyword opportunities for "technical SEO".
```

```text
Use DataForSEO MCP tools to analyze SERP competitors for "best SEO software".
```

```text
Use DataForSEO MCP tools to generate SEO recommendations for example.com.
```

## If It Does Not Work

- Install Node.js 20+ if `node` or `npm` is missing.
- Run `npm install` if modules are missing.
- Run `npm run build` if `dist/server.js` is missing.
- Use an absolute path in the MCP config.
- Fully restart Claude Desktop after config changes.
- Verify DataForSEO credentials if authentication fails.
