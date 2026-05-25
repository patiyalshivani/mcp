---
name: technical-seo-audit-mcp
description: >
  Instructions for using the local technical SEO audit MCP server with Claude,
  Codex, Cursor, VS Code Agent Mode, and SEO agents. Use when connecting the
  audit tool, setting up MCP config, testing URL-level audits, troubleshooting
  credentials, or falling back to no-API technical SEO analysis.
---

# Technical SEO Audit MCP Skill

Use this skill to work with the local technical SEO audit MCP server project.

The server project is located at:

```text
C:\Users\Admin\Desktop\mcp
```

## Reference Files

Load these files when needed:

- `references/mcp-server-setup.md`: build, run, connect, and test the MCP server.
- `references/tool-usage.md`: technical audit tool usage and example prompts.
- `references/no-api-fallbacks.md`: what to do when credentials or MCP tools are unavailable.
- `references/troubleshooting.md`: common errors and fixes.

## Core Rules

- Never hardcode DataForSEO credentials.
- Use environment variables or MCP client `env` blocks only.
- Never print or log `DATAFORSEO_PASSWORD`.
- If MCP tools are unavailable, do not invent live crawl, status, schema, link, or performance data.
- If credentials are missing, use no-API fallback analysis and clearly state the limitation.
- Prefer the local MCP server already built in this folder over asking the user to regenerate files.

## Expected Local Tool

The current local server exposes only:

- `technical_seo_audit`

## Fast Path

If the user asks to run a technical SEO audit:

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
