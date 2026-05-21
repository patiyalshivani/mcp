# Troubleshooting

## `node not found`

Install Node.js 20+ and restart the terminal or desktop app.

Check:

```powershell
node -v
npm -v
```

## `npm not found`

Install Node.js with npm included. Restart the terminal after installation.

## `Cannot find module`

Run:

```powershell
cd C:\Users\sharm\OneDrive\Desktop\mcp\dataforseo-mcp
npm install
```

## `dist/server.js` missing

Run:

```powershell
npm run build
```

## MCP server not visible in Claude

Check:

- the config file is valid JSON
- the path to `dist/server.js` is absolute
- Claude Desktop was fully quit and reopened
- Node is available to Claude Desktop
- credentials are in the `env` block or `.env`

## DataForSEO auth failed

Check:

- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`
- no extra spaces around credentials
- account has API access enabled

Do not print the password while troubleshooting.

## Server starts but appears silent

This is normal for an MCP stdio server. It waits for MCP messages from the client.

## Tool call returns configuration error

Set:

```env
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
```

Then restart the MCP client.
