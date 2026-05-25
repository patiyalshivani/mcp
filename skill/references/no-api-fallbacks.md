# No-API Fallbacks

Use this when DataForSEO credentials or MCP tools are unavailable.

## Hard Rule

Do not invent live SEO data.

Never fabricate:

- Search Console data
- GA4 data
- Lighthouse scores
- Core Web Vitals field data
- crawl results that were not actually checked
- HTTP status codes that were not verified
- schema, heading, or link findings that were not observed

## DataForSEO Missing

Fallback:

- analyze public pages
- inspect titles, metadata, schema, headings, links, sitemap, and robots.txt
- ask for a crawl export if the user needs site-wide technical data

State:

```text
DataForSEO tools are not connected, so live technical audit checks were not verified.
```

## Credentials Missing

Fallback:

- guide the user to set `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`
- continue with public SEO analysis if they do not want to configure credentials

## Google Search Console Missing

Fallback:

- inspect crawl-visible indexability signals
- check robots directives, canonicals, status codes, and sitemap inclusion

Do not claim whether Google indexed a page.

## PageSpeed Or Lighthouse Missing

Fallback:

- report observable performance hints only
- do not give numeric performance scores

Allowed observations:

- large images
- many third-party scripts
- render-blocking CSS/JS hints
- missing lazy loading
- slow fetch response time

## Crawl Data Missing

Fallback:

- inspect the provided public URL manually
- ask for a crawl export from Screaming Frog, Sitebulb, Ahrefs, Semrush, or DataForSEO

Do not estimate crawl-wide issue counts.
