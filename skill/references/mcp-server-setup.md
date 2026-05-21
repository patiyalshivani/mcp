# MCP Server Setup

The DataForSEO MCP server already exists at:

```text
C:\Users\sharm\OneDrive\Desktop\mcp\dataforseo-mcp
```

Do not regenerate the project unless this folder is missing.

## Build Locally

```powershell
cd C:\Users\sharm\OneDrive\Desktop\mcp\dataforseo-mcp
npm install
npm run build
```

Expected output:

```text
dist/server.js
```

## Credentials

Use either `.env` or the MCP client `env` block.

Required:

```env
DATAFORSEO_LOGIN=your-login
DATAFORSEO_PASSWORD=your-password
DATAFORSEO_BASE_URL=https://api.dataforseo.com
```

Never paste real credentials into chat when a local file or config can be used.

## Claude Desktop Config

Windows config path:

```text
%APPDATA%\Claude\claude_desktop_config.json
```

Use this config:

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

Restart Claude Desktop fully after saving.

## Codex, Cursor, VS Code Agent Mode

Use the same MCP server values:

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
        "DATAFORSEO_PASSWORD": "your-password"
      }
    }
  }
}
```

## Expected Behavior

The MCP stdio server may appear silent when started. That is normal.

- stdout is reserved for MCP protocol messages
- logs go to stderr
- the process waits for MCP client requests

## Verify Connection

Ask the client:

```text
What MCP tools are available?
```

Expected DataForSEO tools:

- `keyword_research`
- `serp_analysis`
- `onpage_analysis`
- `backlinks_analysis`
- `competitors_analysis`
- `ranked_keywords`
