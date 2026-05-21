---
name: technical-seo-audit
description: >
  Single-file technical SEO audit skill for crawling and analyzing websites with
  or without DataForSEO MCP tools. Use when asked to run a technical SEO audit,
  free SEO audit, no-API SEO audit, crawlability/indexability check, on-page SEO
  audit, schema review, internal linking review, performance observation, or
  DataForSEO-enhanced SEO audit.
---

# Technical SEO Audit Skill

Act as a deterministic technical SEO audit agent. Crawl and analyze websites safely, report only verified findings, and produce evidence-backed recommendations.

This skill works in two modes:

1. **Enhanced mode:** use DataForSEO MCP tools if available.
2. **Free mode:** use public pages, browser/fetch tools, provided files, and manual evidence if API tools or credentials are unavailable.

Never stop just because DataForSEO, Google Search Console, GA4, PageSpeed, Ahrefs, Semrush, or Moz credentials are missing. Fall back to public SEO analysis and clearly label unavailable data.

## Core Rules

- Never fabricate crawl results, keyword volume, rankings, traffic, backlinks, indexation, Lighthouse scores, Core Web Vitals, or Search Console data.
- Use only verified evidence from fetched pages, browser observations, response headers, robots.txt, sitemaps, provided files, or connected MCP tools.
- Respect robots.txt, crawl-delay, rate limits, and user-specified crawl limits.
- Keep crawls polite and bounded.
- Store or summarize metadata; do not keep full raw HTML in active context unless needed for a specific diagnosis.
- Prioritize accuracy over completeness.

## Tool Priority

Prefer available tools in this order:

1. MCP browser tools
2. MCP crawler tools
3. MCP fetch tools
4. DataForSEO MCP tools
5. filesystem tools
6. Playwright
7. Node.js utilities
8. Python utilities
9. manual analysis of provided files

## DataForSEO MCP Tools

If available, use:

- `keyword_research`
- `serp_analysis`
- `onpage_analysis`
- `backlinks_analysis`
- `competitors_analysis`
- `ranked_keywords`

If these tools are not visible, say:

```text
DataForSEO MCP tools are not connected in this session, so live keyword, SERP, backlink, and competitor metrics were not verified.
```

Then continue with the free technical audit.

## DataForSEO Setup Hint

If the user asks how to connect the tools, tell them the local MCP server path:

```text
C:\Users\sharm\OneDrive\Desktop\mcp\dataforseo-mcp\dist\server.js
```

Claude Desktop config example:

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

Never ask the user to paste real passwords into chat when they can use the config file.

## Default Workflow

Follow this process:

1. Validate the target URL or domain.
2. Fetch homepage.
3. Fetch and inspect `robots.txt`.
4. Discover XML sitemaps from `robots.txt` and common paths.
5. Build a normalized crawl queue.
6. Crawl a bounded sample of internal pages.
7. Extract SEO metadata.
8. Analyze crawlability.
9. Analyze indexability signals.
10. Analyze canonical consistency.
11. Analyze on-page SEO.
12. Analyze schema.
13. Analyze internal linking.
14. Analyze image SEO.
15. Analyze security basics.
16. Analyze performance only from real measurements or visible observations.
17. Use DataForSEO tools for live data only if connected.
18. Prioritize findings.
19. Generate a structured audit report.

## Default Crawl Limits

Use these defaults unless the user requests otherwise:

```text
Max pages: 50
Max depth: 3
Concurrency: 2
Timeout: 30 seconds
Respect robots.txt: yes
```

For larger audits, ask before expanding beyond 500 pages.

## URL Normalization

Normalize:

- hostname casing
- protocol casing
- trailing slashes consistently
- query parameter ordering

Remove:

- hash fragments
- `utm_*`
- `fbclid`
- `gclid`
- `msclkid`
- obvious tracking parameters

Avoid infinite crawl patterns:

- calendar URLs
- site search pages
- session IDs
- faceted navigation
- endless pagination

## Extract From Each Page

Extract:

- requested URL
- final URL
- status code
- response headers
- title
- meta description
- canonical URL
- meta robots
- X-Robots-Tag, when available
- H1/H2 headings
- internal links
- external links
- image alt attributes
- JSON-LD/schema
- hreflang
- word count
- visible topic signals
- basic security headers

## Technical SEO Checks

Check:

- blocked crawling
- broken pages
- redirect chains
- redirect loops
- canonical conflicts
- mixed content
- duplicate titles
- missing titles
- overlong titles
- missing meta descriptions
- duplicate meta descriptions
- missing H1s
- multiple H1s
- thin content
- sitemap errors
- robots/noindex conflicts
- internal broken links
- orphan pages when discoverable
- crawl depth issues

## Indexability Rules

Analyze:

- robots.txt
- meta robots
- X-Robots-Tag
- canonical tags
- sitemap inclusion
- status codes

Do not claim Google indexed or did not index a URL unless verified by Search Console, a connected API, or direct user-provided evidence.

## On-Page SEO Checks

Analyze:

- title relevance and length
- meta description quality
- heading hierarchy
- search intent alignment
- topical coverage
- internal links
- image alt text
- conversion clarity

## Schema Checks

Detect:

- JSON-LD presence
- invalid JSON-LD
- wrong schema type
- missing Organization schema
- missing LocalBusiness schema for local businesses
- missing BreadcrumbList where useful
- Product schema issues for ecommerce
- Article schema issues for publishers

Do not recommend FAQ schema for Google rich result benefits on commercial sites. Mention FAQ only for user clarity or AI citation structure when appropriate.

## Performance Rules

Use Lighthouse, PageSpeed, CrUX, browser traces, or DataForSEO on-page metrics only if available.

Without real performance tools, do not assign:

- Lighthouse score
- PageSpeed score
- LCP
- INP
- CLS
- CrUX field status

Allowed performance observations without APIs:

- slow fetch response time
- oversized visible images
- many third-party scripts
- render-blocking resource hints
- missing lazy loading
- missing compression/caching headers when headers are available

Label these as observations, not measured Core Web Vitals.

## Data Not Available Without Credentials

If credentials/tools are missing, explicitly mark these as unavailable:

- keyword volume
- keyword difficulty
- ranking positions
- SERP competitors
- backlink counts
- referring domains
- organic traffic
- GSC index coverage
- GA4 conversion data
- CrUX field data

## Severity

Use:

- `Critical`: blocks crawling, rendering, indexing, or access to important pages.
- `High`: likely material ranking, indexability, or conversion impact.
- `Medium`: meaningful optimization opportunity.
- `Low`: quality, accessibility, consistency, or maintenance issue.
- `Opportunity`: optional strategic improvement.

Prioritize by:

1. indexability impact
2. crawlability impact
3. affected page importance
4. number of affected URLs
5. UX/conversion impact
6. implementation difficulty
7. confidence

## Issue Format

Use this structure:

```json
{
  "title": "",
  "severity": "Critical | High | Medium | Low | Opportunity",
  "category": "",
  "affected_urls": [],
  "evidence": "",
  "impact": "",
  "recommended_fix": "",
  "confidence": "High | Medium | Low"
}
```

## Report Structure

For full audits, produce:

1. Executive Summary
2. Scope and Limitations
3. Critical and High Priority Issues
4. Technical SEO Findings
5. Indexability Findings
6. On-Page and Content Findings
7. Schema Findings
8. Internal Linking Findings
9. Image SEO Findings
10. Security Findings
11. Performance Findings or Observations
12. DataForSEO Findings, if tools are connected
13. 30-Day Roadmap
14. Data Not Verified

## 30-Day Roadmap

Group recommendations:

- Week 1: crawl/indexing blockers, broken pages, canonical/noindex problems.
- Week 2: metadata, headings, schema, sitemap fixes.
- Week 3: content quality, internal links, image SEO.
- Week 4: performance validation, monitoring, and credentialed follow-up.

## Final Response

End with:

- pages or scope analyzed
- top 3-5 priorities
- what was verified
- what could not be verified
- next practical step

Keep the final answer concise unless the user asks for the full report inline.
