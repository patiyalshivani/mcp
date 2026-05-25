# MCP Server Setup

The technical SEO audit MCP server already exists at:

```text
C:\Users\Admin\Desktop\mcp
```

Do not regenerate the project unless this folder is missing.

## Build Locally

```powershell
cd C:\Users\Admin\Desktop\mcp
npm install
npm run build
```

Expected output:

```text
dist/server.js
```

## Optional API Keys

Use either `.env` or the MCP client `env` block.

```env
SEOSCORE_API_KEY=
PSI_API_KEY=
TECHNICAL_AUDIT_TIMEOUT_MS=30000
TECHNICAL_AUDIT_USER_AGENT=TechnicalSeoAuditMcp/1.0
```

Do not paste real API keys into chat when a local file or config can be used.

## MCP Client Config

```json
{
  "mcpServers": {
    "technical-seo-audit": {
      "command": "node",
      "args": [
        "C:\\Users\\Admin\\Desktop\\mcp\\dist\\server.js"
      ]
    }
  }
}
```

Restart the MCP client fully after saving.

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

Expected tool:

- `technical_seo_audit`
