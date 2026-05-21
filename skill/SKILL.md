---
name: dataforseo-mcp
description: >
  Instructions for using the local DataForSEO MCP server with Claude, Codex,
  Cursor, VS Code Agent Mode, and SEO agents. Use when connecting DataForSEO
  tools, setting up MCP config, testing keyword/SERP/on-page/backlink tools,
  troubleshooting credentials, or falling back to no-API SEO analysis.
---

# DataForSEO MCP Skill

Use this skill to work with the local DataForSEO MCP server project.

The server project is located at:

```text
C:\Users\sharm\OneDrive\Desktop\mcp\dataforseo-mcp
```

## Reference Files

Load these files when needed:

- `references/mcp-server-setup.md`: build, run, connect, and test the MCP server.
- `references/tool-usage.md`: available MCP tools and example prompts.
- `references/no-api-fallbacks.md`: what to do when credentials or MCP tools are unavailable.
- `references/troubleshooting.md`: common errors and fixes.

## Core Rules

- Never hardcode DataForSEO credentials.
- Use environment variables or MCP client `env` blocks only.
- Never print or log `DATAFORSEO_PASSWORD`.
- If MCP tools are unavailable, do not invent live keyword, ranking, traffic, backlink, or SERP data.
- If credentials are missing, use no-API fallback analysis and clearly state the limitation.
- Prefer the local MCP server already built in this folder over asking the user to regenerate files.

## Expected Local Tools

The current local server exposes:

- `keyword_research`
- `serp_analysis`
- `onpage_analysis`
- `backlinks_analysis`
- `competitors_analysis`
- `ranked_keywords`

## Fast Path

If the user asks to use DataForSEO:

1. Check whether MCP tools are available.
2. If available, call the relevant tool.
3. If not available, load `references/mcp-server-setup.md`.
4. If credentials are missing, load `references/no-api-fallbacks.md`.
5. Give concise setup or fallback guidance.

## Final Response

When helping the user connect or test the server, include:

- what file/path to use
- exact command or config snippet
- what result to expect
- next test prompt
