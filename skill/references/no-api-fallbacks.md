# No-API Fallbacks

Use this when optional API credentials or MCP tools are unavailable.

## Hard Rule

Do not invent live SEO data.

Never fabricate:

- Search Console data
- GA4 data
- Lighthouse or PageSpeed scores
- Core Web Vitals field data
- indexed page counts
- backlinks
- spam scores
- ranking data
- crawl results that were not actually checked
- HTTP status codes that were not verified
- schema, heading, link, or analytics findings that were not observed

## SEO Score API Missing

State:

```text
SEO Score API unavailable — SEOSCORE_API_KEY not set.
```

Fallback:

- continue with public robots.txt, sitemap, HTML, metadata, schema, and analytics-tag checks
- mark composite API checks as unavailable

## PageSpeed Insights Missing

If `PSI_API_KEY` is missing, unauthenticated PSI calls may still work for small ad-hoc audits but are heavily rate-limited.

If PSI fails, state:

```text
Performance metrics unavailable — Google PSI verification required.
```

Fallback:

- report observable performance hints only
- do not give numeric performance or Core Web Vitals scores

## Google Search Console Missing

Fallback:

- inspect crawl-visible indexability signals
- check robots directives, canonicals, status codes, and sitemap inclusion

Do not claim whether Google indexed a page.

## Crawl Data Missing

Fallback:

- inspect the provided public URL only
- ask for a crawl export from Screaming Frog, Sitebulb, Ahrefs, Semrush, or a similar crawler if the user needs site-wide technical data

Do not estimate crawl-wide issue counts.
