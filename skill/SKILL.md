---
name: technical-seo-audit
description: >
  Advanced Technical SEO Audit Agent for ecommerce, SaaS, service businesses,
  IT companies, Shopify stores, WordPress websites, and custom web applications.
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

- Never hardcode API keys.
- Use environment variables or MCP client `env` blocks only.
- Never print or log `SEOSCORE_API_KEY` or `PSI_API_KEY`.
- If MCP tools are unavailable, do not invent live crawl, status, schema, link, indexability, analytics, or performance data.
- If credentials are missing, use no-API fallback analysis and clearly state the limitation.
- Prefer the local MCP server already built in this folder over asking the user to regenerate files.
- Respect robots.txt, crawl-delay, limited crawl scope, and URL-parameter safety.

## Expected Local Tool

The current local server exposes only:

- `technical_seo_audit`

## Fast Path

If the user asks to run a technical SEO audit:

1. Check whether MCP tools are available.
2. If available, call the relevant tool.
3. If not available, load `references/mcp-server-setup.md`.
4. If credentials are missing, load `references/no-api-fallbacks.md`.
5. Separate verified, partially verified, estimated, and unverified findings.
6. Give concise setup or fallback guidance.

## Audit Structure

Every audit report must include:

- Executive Summary
- Findings Table
- Priority Recommendations
- Business Impact Analysis

The audit itself must be divided into:

- Part 1: Indexability and Crawlability
- Part 2: On-Page SEO Analysis
- Part 3: Performance and Mobile SEO
- Part 4: Structured Data and Analytics

Each issue must include URL, issue type, severity, recommendation, and confidence level.

## Final Response

When helping the user connect or test the server, include:

- what file/path to use
- exact command or config snippet
- what result to expect
- next test prompt
