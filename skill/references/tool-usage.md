# Tool Usage

Use these examples once the DataForSEO MCP server is connected.

## keyword_research

Input:

```json
{
  "keyword": "seo audit tool",
  "location": "United States",
  "language": "English"
}
```

Prompt:

```text
Use DataForSEO to run keyword research for "seo audit tool" in United States.
```

Returns:

- search volume
- CPC
- competition
- keyword difficulty when available
- search intent when available

## serp_analysis

Input:

```json
{
  "keyword": "best seo tools",
  "location": "United States"
}
```

Prompt:

```text
Use DataForSEO to analyze the SERP for "best SEO tools" in United States.
```

Returns:

- top ranking pages
- featured snippets
- SERP features
- rankings
- available domain data

## onpage_analysis

Input:

```json
{
  "url": "https://example.com"
}
```

Prompt:

```text
Use DataForSEO to analyze the on-page SEO for https://example.com.
```

Returns:

- title
- headings
- schema
- internal links
- status code
- meta description
- page metrics

## backlinks_analysis

Input:

```json
{
  "domain": "example.com"
}
```

Prompt:

```text
Use DataForSEO to analyze backlinks for example.com.
```

Returns:

- backlinks
- referring domains
- anchor text
- toxicity metrics when available

## competitors_analysis

Input:

```json
{
  "domain": "example.com"
}
```

Prompt:

```text
Use DataForSEO to find organic competitors for example.com.
```

Returns:

- competitor domains
- overlap indicators
- visibility comparison

## ranked_keywords

Input:

```json
{
  "domain": "example.com",
  "location": "United States",
  "language": "English"
}
```

Prompt:

```text
Use DataForSEO to find ranked keywords for example.com in United States.
```
