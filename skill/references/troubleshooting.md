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
cd C:\Users\Admin\Desktop\mcp
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
- optional API keys are in the `env` block or `.env`

## SEO Score API unavailable

Check:

- `SEOSCORE_API_KEY` is set if API verification is needed
- the key has remaining quota
- 401 and 429 responses should be reported as API errors, not replaced with made-up scores

## PageSpeed Insights unavailable

Check:

- `PSI_API_KEY` is set for authenticated quota
- unauthenticated calls may be rate-limited
- network access is available from the deployment

## Server starts but appears silent

This is normal for an MCP stdio server. It waits for MCP messages from the client.

## Tool call returns unverified sections

That means the required source was unavailable. Use the relevant API key, a crawl export, or Search Console access for verification.
