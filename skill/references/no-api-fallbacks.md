# No-API Fallbacks

Use this when DataForSEO credentials or MCP tools are unavailable.

## Hard Rule

Do not invent live SEO data.

Never fabricate:

- keyword volume
- rankings
- SERP positions
- backlink counts
- referring domains
- domain authority
- organic traffic
- Search Console data
- GA4 data
- Lighthouse scores
- Core Web Vitals field data

## DataForSEO Missing

Fallback:

- analyze public pages
- inspect titles, metadata, schema, headings, links, sitemap, and robots.txt
- ask for exported keyword, SERP, or backlink data if the user needs live metrics

State:

```text
DataForSEO tools are not connected, so live keyword volume, SERP, and backlink metrics were not verified.
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

## Backlink Data Missing

Fallback:

- inspect linkable assets
- review authority/trust signals on public pages
- ask for Ahrefs, Semrush, Moz, or DataForSEO export

Do not estimate backlink counts.
