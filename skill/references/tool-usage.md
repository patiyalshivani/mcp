# Tool Usage

Use this example once the technical SEO audit MCP server is connected.

## technical_seo_audit

Input:

```json
{
  "url": "https://example.com",
  "include_page_speed": true,
  "include_optional_api_checks": true
}
```

Prompt:

```text
Run a full technical SEO audit for https://example.com.
```

Returns:

- executive summary and issue counts
- Part 1: indexability and crawlability
- Part 2: on-page SEO analysis
- Part 3: performance and mobile SEO
- Part 4: structured data and analytics
- findings table with severity, URL, issue, recommendation, and confidence
- immediate, mid-term, and long-term recommendations
- business impact analysis

Optional verification:

- `SEOSCORE_API_KEY` enables SEO Score API summary checks.
- `PSI_API_KEY` enables authenticated Google PageSpeed Insights checks.
- Missing API access is reported as unverified instead of fabricated.
