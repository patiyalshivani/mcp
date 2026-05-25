import { getEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export type Severity = "Critical" | "High" | "Medium" | "Low";
export type Confidence = "Verified" | "Partially Verified" | "Estimated" | "Unverified";

export interface Finding {
  severity: Severity;
  url: string;
  issue_type: string;
  issue: string;
  recommendation: string;
  confidence: Confidence;
  evidence?: string;
}

export interface TechnicalAuditOptions {
  includePageSpeed: boolean;
  includeOptionalApiChecks: boolean;
}

export interface TechnicalAuditReport extends Record<string, unknown> {
  executive_summary: {
    overall_seo_health_score: number | null;
    score_confidence: Confidence;
    total_issue_count: number;
    critical_issues: number;
    high_issues: number;
    medium_issues: number;
    low_priority_issues: number;
  };
  audit_scope: {
    url: string;
    final_url: string | null;
    generated_at: string;
    crawl_safety: string[];
  };
  verified_sources: SourceStatus[];
  part_1_indexability_crawlability: Record<string, unknown>;
  part_2_on_page_seo_analysis: Record<string, unknown>;
  part_3_performance_mobile_seo: Record<string, unknown>;
  part_4_structured_data_analytics: Record<string, unknown>;
  findings_table: Finding[];
  priority_recommendations: {
    immediate_fixes_0_7_days: string[];
    mid_term_improvements_7_30_days: string[];
    long_term_seo_strategy_30_90_days: string[];
  };
  business_impact_analysis: {
    traffic_impact: string;
    crawlability_impact: string;
    ux_impact: string;
    conversion_impact: string;
    ranking_impact: string;
  };
  unverified_items: string[];
}

interface SourceStatus {
  source: string;
  status: "Verified" | "Partially Verified" | "Unavailable" | "Failed" | "Skipped";
  message: string;
}

interface FetchSnapshot {
  requested_url: string;
  final_url: string;
  status_code: number;
  ok: boolean;
  content_type: string | null;
  body: string;
}

interface RobotsAnalysis {
  exists: boolean;
  status_code: number | null;
  sitemap_urls: string[];
  crawl_delay_seconds: number | null;
  target_blocked: boolean;
  blocking_rules: string[];
}

interface SitemapAnalysis {
  checked_urls: Array<{
    url: string;
    status_code: number | null;
    loc_count: number;
    includes_target_url: boolean;
    error?: string;
  }>;
  found: boolean;
  includes_target_url: boolean;
}

interface PageSignals {
  status_code: number;
  final_url: string;
  html_bytes: number;
  title: string | null;
  meta_description: string | null;
  canonical: string | null;
  robots_meta: string | null;
  has_noindex: boolean;
  h1: string[];
  h2: string[];
  semantic_tags: Record<string, boolean>;
  viewport: string | null;
  text_to_html_ratio_percent: number;
  images: ImageSignal[];
  links: LinkSignal[];
  schema: {
    json_ld_blocks: number;
    valid_json_ld_blocks: number;
    invalid_json_ld_blocks: number;
    types: string[];
  };
  analytics: {
    ga4_detected: boolean;
    gtm_detected: boolean;
    gsc_verification_detected: boolean;
  };
  social_profiles: Record<string, string[]>;
  blog_link_detected: boolean;
  mixed_content_urls: string[];
}

interface ImageSignal {
  src: string | null;
  alt: string | null;
  loading: string | null;
  format: string | null;
}

interface ImageSummary {
  total_images: number;
  missing_alt_count: number;
  missing_lazy_loading_count: number;
  non_optimized_format_count: number;
  oversized_images: string;
  recommendation: string;
}

interface LinkSignal {
  href: string;
  normalized_url: string | null;
  internal: boolean;
}

interface PageSpeedSummary {
  strategy: "mobile" | "desktop";
  performance_score: number | null;
  seo_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  largest_contentful_paint_ms: number | null;
  cumulative_layout_shift: number | null;
  interaction_to_next_paint_ms: number | null;
  viewport_passed: boolean | null;
  source: "Google PSI";
}

interface SeoScoreSummary {
  score: number | null;
  top_level_keys: string[];
  failed_check_count: number | null;
}

export async function runTechnicalAudit(url: string, options: TechnicalAuditOptions): Promise<TechnicalAuditReport> {
  const normalizedUrl = new URL(url).toString();
  const target = new URL(normalizedUrl);
  const findings: Finding[] = [];
  const sources: SourceStatus[] = [];
  const unverifiedItems = new Set<string>();
  const crawlSafety = [
    "robots.txt checked before page analysis",
    "single URL scope with limited sitemap and 404 checks",
    "no URL parameter crawling",
    "optional external APIs used only when configured"
  ];

  const robots = await getRobotsAnalysis(target, sources, findings);

  let seoScoreSummary: SeoScoreSummary | null = null;
  if (options.includeOptionalApiChecks && !robots.target_blocked) {
    seoScoreSummary = await getSeoScoreSummary(normalizedUrl, sources);
  } else if (!options.includeOptionalApiChecks) {
    sources.push({ source: "SEO Score API", status: "Skipped", message: "Optional API checks disabled for this run." });
  } else {
    sources.push({ source: "SEO Score API", status: "Skipped", message: "Skipped because robots.txt blocks the target path." });
  }

  const sitemap = robots.target_blocked
    ? skippedSitemapAnalysis(sources)
    : await getSitemapAnalysis(target, robots.sitemap_urls, sources, findings);

  const page = robots.target_blocked
    ? null
    : await getPageSignals(normalizedUrl, sources, findings);

  const custom404 = robots.target_blocked
    ? { checked: false, status_code: null, proper_404_status: null, message: "Skipped because robots.txt blocks the target path." }
    : await checkCustom404(target, robots.crawl_delay_seconds, sources, findings);

  const pageSpeed = page && options.includePageSpeed
    ? await getPageSpeedSummaries(normalizedUrl, sources, findings)
    : [];
  if (!options.includePageSpeed) {
    sources.push({ source: "Google PageSpeed Insights", status: "Skipped", message: "PageSpeed checks disabled for this run." });
    unverifiedItems.add("Performance metrics require PageSpeed Insights verification.");
  }

  if (!page) {
    unverifiedItems.add("On-page metadata, headings, schema, analytics, and image checks were skipped because the URL was blocked or unavailable.");
  }

  addRobotsFindings(normalizedUrl, robots, findings);
  addSitemapFindings(normalizedUrl, sitemap, findings);
  if (page) {
    addPageFindings(normalizedUrl, target, page, findings, unverifiedItems);
  }
  addCustom404Findings(normalizedUrl, custom404, findings);
  addPageSpeedFindings(normalizedUrl, pageSpeed, findings, unverifiedItems);
  addUnavailableVerificationNotes(unverifiedItems);

  const counts = countFindings(findings);
  const fallbackScore = estimateHealthScore(findings);
  const score = seoScoreSummary?.score ?? fallbackScore;
  const scoreConfidence: Confidence = seoScoreSummary?.score !== null && seoScoreSummary?.score !== undefined ? "Verified" : "Estimated";

  return {
    executive_summary: {
      overall_seo_health_score: score,
      score_confidence: scoreConfidence,
      total_issue_count: findings.length,
      critical_issues: counts.Critical,
      high_issues: counts.High,
      medium_issues: counts.Medium,
      low_priority_issues: counts.Low
    },
    audit_scope: {
      url: normalizedUrl,
      final_url: page?.final_url ?? null,
      generated_at: new Date().toISOString(),
      crawl_safety: crawlSafety
    },
    verified_sources: sources,
    part_1_indexability_crawlability: {
      indexed_pages: "Indexing status requires Google Search Console verification.",
      robots_txt: robots,
      xml_sitemap: sitemap,
      canonicalization: page ? {
        canonical_url: page.canonical,
        self_referencing: page.canonical ? urlsEquivalent(page.canonical, page.final_url) : false
      } : "Unverified — requires crawl access",
      ssl_certificate: {
        https_enabled: target.protocol === "https:",
        mixed_content_urls: page?.mixed_content_urls ?? [],
        ssl_labs_grade: "Unverified — requires SSL Labs API or tool access"
      },
      custom_404_page: custom404,
      broken_links: "Unverified — requires crawler export or link-checking API access"
    },
    part_2_on_page_seo_analysis: page ? {
      url_structure: analyzeUrlStructure(target),
      meta_titles: classifyTitle(page.title),
      meta_descriptions: classifyMetaDescription(page.meta_description),
      heading_structure: {
        h1_count: page.h1.length,
        h1: page.h1,
        h2_count: page.h2.length,
        h2_sample: page.h2.slice(0, 10)
      },
      semantic_html: page.semantic_tags,
      duplicate_content: "Unverified — requires site-wide crawl or duplicate-content API access",
      image_optimization: summarizeImages(page.images),
      blog_presence: {
        detected_from_links: page.blog_link_detected
      }
    } : {
      status: "Unverified — requires crawl access"
    },
    part_3_performance_mobile_seo: {
      page_speed: pageSpeed.length ? pageSpeed : "Performance metrics require PageSpeed Insights verification.",
      core_web_vitals: summarizeCoreWebVitals(pageSpeed),
      mobile_friendly_test: {
        viewport_configured: page?.viewport ? true : null,
        psi_mobile_viewport_passed: pageSpeed.find((item) => item.strategy === "mobile")?.viewport_passed ?? null
      },
      text_to_html_ratio: page?.text_to_html_ratio_percent ?? null,
      image_weight_analysis: "Unverified — requires image HEAD checks, crawler export, or performance API access"
    },
    part_4_structured_data_analytics: page ? {
      schema_validation: page.schema,
      google_analytics: {
        ga4_detected: page.analytics.ga4_detected,
        duplicate_ga_scripts: "Unverified — requires full script inventory review"
      },
      google_tag_manager: {
        gtm_detected: page.analytics.gtm_detected
      },
      google_search_console: {
        verification_tag_detected: page.analytics.gsc_verification_detected,
        integration_status: "Unverified — requires Google Search Console access"
      },
      social_media_presence: page.social_profiles,
      seo_score_api: seoScoreSummary ?? "SEO Score API unavailable — SEOSCORE_API_KEY not set."
    } : {
      status: "Unverified — requires crawl access",
      seo_score_api: seoScoreSummary ?? "SEO Score API unavailable — SEOSCORE_API_KEY not set."
    },
    findings_table: findings,
    priority_recommendations: buildPriorities(findings),
    business_impact_analysis: buildBusinessImpact(findings),
    unverified_items: Array.from(unverifiedItems)
  };
}

async function getRobotsAnalysis(target: URL, sources: SourceStatus[], findings: Finding[]): Promise<RobotsAnalysis> {
  const robotsUrl = new URL("/robots.txt", target.origin).toString();
  try {
    const snapshot = await fetchText(robotsUrl);
    const exists = snapshot.status_code >= 200 && snapshot.status_code < 400 && snapshot.body.trim().length > 0;
    const analysis = exists
      ? parseRobots(snapshot.body, target)
      : { sitemap_urls: [], crawl_delay_seconds: null, target_blocked: false, blocking_rules: [] };
    sources.push({
      source: "robots.txt",
      status: "Verified",
      message: exists ? `robots.txt found with status ${snapshot.status_code}.` : `robots.txt not found or empty; status ${snapshot.status_code}.`
    });
    return {
      exists,
      status_code: snapshot.status_code,
      sitemap_urls: analysis.sitemap_urls,
      crawl_delay_seconds: analysis.crawl_delay_seconds,
      target_blocked: analysis.target_blocked,
      blocking_rules: analysis.blocking_rules
    };
  } catch (error) {
    findings.push({
      severity: "Medium",
      url: target.origin,
      issue_type: "Robots.txt",
      issue: "robots.txt could not be fetched.",
      recommendation: "Verify robots.txt availability and server response for crawlers.",
      confidence: "Partially Verified",
      evidence: errorMessage(error)
    });
    sources.push({ source: "robots.txt", status: "Failed", message: errorMessage(error) });
    return { exists: false, status_code: null, sitemap_urls: [], crawl_delay_seconds: null, target_blocked: false, blocking_rules: [] };
  }
}

async function getSeoScoreSummary(url: string, sources: SourceStatus[]): Promise<SeoScoreSummary | null> {
  const env = getEnv();
  if (!env.SEOSCORE_API_KEY) {
    sources.push({ source: "SEO Score API", status: "Unavailable", message: "SEO Score API unavailable — SEOSCORE_API_KEY not set." });
    return null;
  }

  try {
    const endpoint = `https://seoscoreapi.com/audit?url=${encodeURIComponent(url)}`;
    const data = await fetchJson(endpoint, {
      "X-API-Key": env.SEOSCORE_API_KEY,
      accept: "application/json"
    });
    const record = asRecord(data);
    const score = findScore(record);
    const failedCheckCount = countFailedChecks(record);
    sources.push({
      source: "SEO Score API",
      status: "Verified",
      message: score === null ? "Audit returned successfully; score field was not recognized." : `Audit returned score ${score}.`
    });
    return {
      score,
      top_level_keys: Object.keys(record),
      failed_check_count: failedCheckCount
    };
  } catch (error) {
    sources.push({ source: "SEO Score API", status: "Failed", message: errorMessage(error) });
    return null;
  }
}

async function getSitemapAnalysis(target: URL, robotsSitemaps: string[], sources: SourceStatus[], findings: Finding[]): Promise<SitemapAnalysis> {
  const candidates = uniqueStrings([
    ...robotsSitemaps,
    new URL("/sitemap.xml", target.origin).toString(),
    new URL("/sitemap_index.xml", target.origin).toString()
  ]).slice(0, 4);

  const checkedUrls: SitemapAnalysis["checked_urls"] = [];
  for (const sitemapUrl of candidates) {
    try {
      const snapshot = await fetchText(sitemapUrl, { accept: "application/xml,text/xml,text/plain,*/*" });
      const locs = extractXmlLocs(snapshot.body);
      checkedUrls.push({
        url: sitemapUrl,
        status_code: snapshot.status_code,
        loc_count: locs.length,
        includes_target_url: locs.some((item) => urlsEquivalent(item, target.toString()))
      });
    } catch (error) {
      checkedUrls.push({
        url: sitemapUrl,
        status_code: null,
        loc_count: 0,
        includes_target_url: false,
        error: errorMessage(error)
      });
    }
  }

  const found = checkedUrls.some((item) => item.status_code !== null && item.status_code >= 200 && item.status_code < 400 && item.loc_count > 0);
  const includesTargetUrl = checkedUrls.some((item) => item.includes_target_url);
  sources.push({
    source: "XML sitemap",
    status: found ? "Verified" : "Partially Verified",
    message: found ? "At least one sitemap was found and parsed." : "No parseable sitemap found in robots.txt, /sitemap.xml, or /sitemap_index.xml."
  });

  if (!found) {
    findings.push({
      severity: "Medium",
      url: target.origin,
      issue_type: "XML Sitemap",
      issue: "No parseable XML sitemap was found in standard locations.",
      recommendation: "Publish a clean XML sitemap and declare it in robots.txt.",
      confidence: "Partially Verified"
    });
  }

  return { checked_urls: checkedUrls, found, includes_target_url: includesTargetUrl };
}

function skippedSitemapAnalysis(sources: SourceStatus[]): SitemapAnalysis {
  sources.push({ source: "XML sitemap", status: "Skipped", message: "Skipped because robots.txt blocks the target path." });
  return { checked_urls: [], found: false, includes_target_url: false };
}

async function getPageSignals(url: string, sources: SourceStatus[], findings: Finding[]): Promise<PageSignals | null> {
  try {
    const snapshot = await fetchText(url, { accept: "text/html,application/xhtml+xml,*/*" });
    sources.push({
      source: "HTML source",
      status: "Verified",
      message: `Fetched ${snapshot.final_url} with HTTP ${snapshot.status_code}.`
    });
    if (!snapshot.content_type?.includes("html")) {
      findings.push({
        severity: "High",
        url,
        issue_type: "Content Type",
        issue: "The audited URL did not return HTML content.",
        recommendation: "Ensure indexable landing pages return text/html content.",
        confidence: "Verified",
        evidence: snapshot.content_type ?? "Missing content-type header"
      });
    }
    return analyzeHtml(snapshot);
  } catch (error) {
    findings.push({
      severity: "High",
      url,
      issue_type: "Page Fetch",
      issue: "The target URL could not be fetched.",
      recommendation: "Verify the page is publicly reachable and not blocking audit user agents.",
      confidence: "Partially Verified",
      evidence: errorMessage(error)
    });
    sources.push({ source: "HTML source", status: "Failed", message: errorMessage(error) });
    return null;
  }
}

async function checkCustom404(target: URL, crawlDelaySeconds: number | null, sources: SourceStatus[], findings: Finding[]) {
  if (crawlDelaySeconds !== null && crawlDelaySeconds > 10) {
    sources.push({ source: "Custom 404", status: "Skipped", message: `Skipped optional 404 request to respect crawl-delay: ${crawlDelaySeconds}s.` });
    return { checked: false, status_code: null, proper_404_status: null, message: "Skipped to respect crawl-delay." };
  }

  const path = `/_technical-seo-audit-missing-${Date.now()}`;
  const url = new URL(path, target.origin).toString();
  try {
    const snapshot = await fetchText(url, { accept: "text/html,*/*" });
    sources.push({ source: "Custom 404", status: "Verified", message: `Missing URL returned HTTP ${snapshot.status_code}.` });
    return {
      checked: true,
      status_code: snapshot.status_code,
      proper_404_status: snapshot.status_code === 404,
      branded_or_custom_page_likely: snapshot.body.replace(/<[^>]+>/g, " ").trim().length > 120
    };
  } catch (error) {
    findings.push({
      severity: "Low",
      url: target.origin,
      issue_type: "Custom 404",
      issue: "Custom 404 check could not be completed.",
      recommendation: "Manually verify that missing URLs return HTTP 404 with a useful branded page.",
      confidence: "Partially Verified",
      evidence: errorMessage(error)
    });
    sources.push({ source: "Custom 404", status: "Failed", message: errorMessage(error) });
    return { checked: false, status_code: null, proper_404_status: null, message: errorMessage(error) };
  }
}

async function getPageSpeedSummaries(url: string, sources: SourceStatus[], findings: Finding[]): Promise<PageSpeedSummary[]> {
  const env = getEnv();
  if (!env.PSI_API_KEY) {
    sources.push({
      source: "Google PageSpeed Insights",
      status: "Partially Verified",
      message: "PSI key not set — unauthenticated calls are heavily rate-limited; large audits will fail."
    });
  }

  const summaries: PageSpeedSummary[] = [];
  for (const strategy of ["mobile", "desktop"] as const) {
    try {
      const params = new URLSearchParams();
      params.set("url", url);
      params.set("strategy", strategy);
      for (const category of ["performance", "seo", "accessibility", "best-practices"]) {
        params.append("category", category);
      }
      if (env.PSI_API_KEY) params.set("key", env.PSI_API_KEY);
      const data = await fetchJson(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`, {
        accept: "application/json"
      });
      summaries.push(parsePageSpeedSummary(strategy, data));
    } catch (error) {
      findings.push({
        severity: "Medium",
        url,
        issue_type: "PageSpeed Insights",
        issue: `Google PSI ${strategy} verification failed.`,
        recommendation: "Run PageSpeed Insights again with a valid PSI_API_KEY or verify Lighthouse locally.",
        confidence: "Partially Verified",
        evidence: errorMessage(error)
      });
      sources.push({ source: `Google PSI ${strategy}`, status: "Failed", message: errorMessage(error) });
    }
  }

  if (summaries.length > 0) {
    sources.push({ source: "Google PageSpeed Insights", status: "Verified", message: `Received ${summaries.length} PSI result(s).` });
  }
  return summaries;
}

function analyzeHtml(snapshot: FetchSnapshot): PageSignals {
  const html = snapshot.body;
  const title = cleanText(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const metaDescription = getMetaContent(html, "description");
  const canonical = getLinkHref(html, "canonical");
  const robotsMeta = getMetaContent(html, "robots");
  const h1 = getTagTexts(html, "h1");
  const h2 = getTagTexts(html, "h2");
  const semanticTags = Object.fromEntries(
    ["header", "nav", "main", "article", "section", "aside", "footer"].map((tag) => [tag, new RegExp(`<${tag}\\b`, "i").test(html)])
  );
  const images = extractImages(html);
  const links = extractLinks(html, snapshot.final_url);
  const schema = extractSchema(html);
  const textLength = stripHtml(html).length;
  const ratio = html.length > 0 ? Math.round((textLength / html.length) * 1000) / 10 : 0;

  return {
    status_code: snapshot.status_code,
    final_url: snapshot.final_url,
    html_bytes: Buffer.byteLength(html, "utf8"),
    title,
    meta_description: metaDescription,
    canonical,
    robots_meta: robotsMeta,
    has_noindex: Boolean(robotsMeta && /\bnoindex\b/i.test(robotsMeta)),
    h1,
    h2,
    semantic_tags: semanticTags,
    viewport: getMetaContent(html, "viewport"),
    text_to_html_ratio_percent: ratio,
    images,
    links,
    schema,
    analytics: {
      ga4_detected: /\bG-[A-Z0-9]{4,}\b/i.test(html) || /googletagmanager\.com\/gtag\/js/i.test(html),
      gtm_detected: /\bGTM-[A-Z0-9]+\b/i.test(html),
      gsc_verification_detected: /google-site-verification/i.test(html)
    },
    social_profiles: extractSocialProfiles(links),
    blog_link_detected: links.some((link) => /\/(blog|resources|articles|insights)(\/|$)/i.test(link.normalized_url ?? link.href)),
    mixed_content_urls: snapshot.final_url.startsWith("https:")
      ? extractMixedContentUrls(html)
      : []
  };
}

function addRobotsFindings(url: string, robots: RobotsAnalysis, findings: Finding[]): void {
  if (!robots.exists) {
    findings.push({
      severity: "Low",
      url: new URL(url).origin,
      issue_type: "Robots.txt",
      issue: "robots.txt is missing or empty.",
      recommendation: "Create a robots.txt file with crawler rules and sitemap declaration.",
      confidence: "Verified"
    });
  }
  if (robots.sitemap_urls.length === 0) {
    findings.push({
      severity: "Low",
      url: new URL(url).origin,
      issue_type: "Robots.txt",
      issue: "robots.txt does not declare an XML sitemap.",
      recommendation: "Add a Sitemap directive that points to the canonical XML sitemap.",
      confidence: robots.exists ? "Verified" : "Partially Verified"
    });
  }
  if (robots.target_blocked) {
    findings.push({
      severity: "Critical",
      url,
      issue_type: "Indexability",
      issue: "robots.txt blocks the audited URL path.",
      recommendation: "Remove or narrow the disallow rule if this page should be crawled and indexed.",
      confidence: "Verified",
      evidence: robots.blocking_rules.join(", ")
    });
  }
}

function addSitemapFindings(url: string, sitemap: SitemapAnalysis, findings: Finding[]): void {
  if (sitemap.found && !sitemap.includes_target_url) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "XML Sitemap",
      issue: "The audited URL was not found in checked sitemap files.",
      recommendation: "Include canonical indexable URLs in the XML sitemap.",
      confidence: "Partially Verified"
    });
  }
}

function addPageFindings(url: string, target: URL, page: PageSignals, findings: Finding[], unverifiedItems: Set<string>): void {
  if (page.status_code >= 500) {
    findings.push({
      severity: "Critical",
      url,
      issue_type: "HTTP Status",
      issue: `Page returned server error HTTP ${page.status_code}.`,
      recommendation: "Fix server errors before relying on organic search traffic.",
      confidence: "Verified"
    });
  } else if (page.status_code >= 400) {
    findings.push({
      severity: "High",
      url,
      issue_type: "HTTP Status",
      issue: `Page returned HTTP ${page.status_code}.`,
      recommendation: "Ensure indexable pages return HTTP 200.",
      confidence: "Verified"
    });
  }

  if (target.protocol !== "https:") {
    findings.push({
      severity: "Critical",
      url,
      issue_type: "SSL",
      issue: "The audited URL is not HTTPS.",
      recommendation: "Force HTTPS and redirect HTTP URLs to their HTTPS canonical versions.",
      confidence: "Verified"
    });
  }

  if (page.mixed_content_urls.length > 0) {
    findings.push({
      severity: "High",
      url,
      issue_type: "Mixed Content",
      issue: "HTTPS page references insecure HTTP assets.",
      recommendation: "Update asset URLs to HTTPS.",
      confidence: "Verified",
      evidence: page.mixed_content_urls.slice(0, 5).join(", ")
    });
  }

  if (page.has_noindex) {
    findings.push({
      severity: "Critical",
      url,
      issue_type: "Indexability",
      issue: "Page contains a noindex robots directive.",
      recommendation: "Remove noindex if the page should appear in search results.",
      confidence: "Verified",
      evidence: page.robots_meta ?? undefined
    });
  }

  for (const issue of analyzeUrlStructure(target).issues as string[]) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "URL Structure",
      issue,
      recommendation: "Use short, lowercase, readable URLs with hyphens and minimal parameters.",
      confidence: "Verified"
    });
  }

  if (!page.title) {
    findings.push({
      severity: "High",
      url,
      issue_type: "Meta Title",
      issue: "Meta title is missing.",
      recommendation: "Add a unique title between 40 and 60 characters.",
      confidence: "Verified"
    });
  } else if (page.title.length < 40 || page.title.length > 60) {
    findings.push({
      severity: "Medium",
      url,
      issue_type: "Meta Title",
      issue: `Meta title length is ${page.title.length} characters.`,
      recommendation: "Rewrite the title to stay between 40 and 60 characters while preserving relevance.",
      confidence: "Verified",
      evidence: page.title
    });
  }

  if (!page.meta_description) {
    findings.push({
      severity: "Medium",
      url,
      issue_type: "Meta Description",
      issue: "Meta description is missing.",
      recommendation: "Add a unique description between 140 and 160 characters.",
      confidence: "Verified"
    });
  } else if (page.meta_description.length < 140 || page.meta_description.length > 160) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Meta Description",
      issue: `Meta description length is ${page.meta_description.length} characters.`,
      recommendation: "Rewrite the description to stay close to 140-160 characters.",
      confidence: "Verified",
      evidence: page.meta_description
    });
  }

  if (!page.canonical) {
    findings.push({
      severity: "Medium",
      url,
      issue_type: "Canonicalization",
      issue: "Canonical tag is missing.",
      recommendation: "Add a self-referencing canonical tag on indexable pages.",
      confidence: "Verified"
    });
  } else if (!urlsEquivalent(page.canonical, page.final_url)) {
    findings.push({
      severity: "Medium",
      url,
      issue_type: "Canonicalization",
      issue: "Canonical URL does not match the final fetched URL.",
      recommendation: "Confirm the canonical points to the preferred indexable URL.",
      confidence: "Verified",
      evidence: page.canonical
    });
  }

  if (page.h1.length === 0) {
    findings.push({
      severity: "High",
      url,
      issue_type: "Heading Structure",
      issue: "Page is missing an H1.",
      recommendation: "Add one descriptive H1 that matches the page topic.",
      confidence: "Verified"
    });
  } else if (page.h1.length > 1) {
    findings.push({
      severity: "Medium",
      url,
      issue_type: "Heading Structure",
      issue: `Page has ${page.h1.length} H1 tags.`,
      recommendation: "Use one primary H1 and move secondary section titles to H2/H3.",
      confidence: "Verified"
    });
  }

  if (page.h2.length === 0) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Heading Structure",
      issue: "Page has no H2 tags.",
      recommendation: "Use H2 sections to make the page easier for users and crawlers to scan.",
      confidence: "Verified"
    });
  }

  const missingSemanticTags = Object.entries(page.semantic_tags).filter(([, present]) => !present).map(([tag]) => tag);
  if (missingSemanticTags.includes("main")) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Semantic HTML",
      issue: "Page does not use a main landmark.",
      recommendation: "Wrap primary content in a <main> element.",
      confidence: "Verified"
    });
  }

  const imageSummary = summarizeImages(page.images);
  if (imageSummary.missing_alt_count > 0) {
    findings.push({
      severity: "Medium",
      url,
      issue_type: "Image Optimization",
      issue: `${imageSummary.missing_alt_count} image(s) are missing ALT text.`,
      recommendation: "Add concise, descriptive ALT text to meaningful images.",
      confidence: "Verified"
    });
  }
  if (imageSummary.missing_lazy_loading_count > 0) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Image Optimization",
      issue: `${imageSummary.missing_lazy_loading_count} image(s) do not declare lazy loading.`,
      recommendation: "Use lazy loading for below-the-fold images.",
      confidence: "Verified"
    });
  }
  if (imageSummary.non_optimized_format_count > 0) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Image Optimization",
      issue: `${imageSummary.non_optimized_format_count} image(s) appear to use non-modern formats.`,
      recommendation: "Serve WebP or AVIF where practical and compress large images.",
      confidence: "Partially Verified"
    });
  }

  if (!page.viewport) {
    findings.push({
      severity: "High",
      url,
      issue_type: "Mobile Friendly",
      issue: "Viewport meta tag is missing.",
      recommendation: "Add a responsive viewport meta tag.",
      confidence: "Verified"
    });
  }

  if (page.text_to_html_ratio_percent < 10) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Text to HTML Ratio",
      issue: `Text to HTML ratio is ${page.text_to_html_ratio_percent}%.`,
      recommendation: "Reduce unnecessary markup and ensure meaningful crawlable text is present.",
      confidence: "Estimated"
    });
  }

  if (page.schema.json_ld_blocks === 0) {
    findings.push({
      severity: "Medium",
      url,
      issue_type: "Structured Data",
      issue: "No JSON-LD structured data was detected.",
      recommendation: "Add relevant JSON-LD such as Organization, Breadcrumb, Product, FAQ, LocalBusiness, or Article schema.",
      confidence: "Verified"
    });
  } else if (page.schema.invalid_json_ld_blocks > 0) {
    findings.push({
      severity: "High",
      url,
      issue_type: "Structured Data",
      issue: `${page.schema.invalid_json_ld_blocks} JSON-LD block(s) are invalid JSON.`,
      recommendation: "Fix JSON-LD syntax and validate with Schema Validator.",
      confidence: "Verified"
    });
  }

  if (!page.analytics.ga4_detected) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Google Analytics",
      issue: "GA4 was not detected in the HTML source.",
      recommendation: "Verify GA4 installation or confirm analytics are intentionally loaded through a consent manager.",
      confidence: "Partially Verified"
    });
  }
  if (!page.analytics.gtm_detected) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Google Tag Manager",
      issue: "GTM container was not detected in the HTML source.",
      recommendation: "Add GTM if tag management is required, or document the alternative implementation.",
      confidence: "Partially Verified"
    });
  }
  if (!page.analytics.gsc_verification_detected) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Google Search Console",
      issue: "Google Search Console verification tag was not detected in the HTML source.",
      recommendation: "Verify GSC ownership through DNS, HTML file, meta tag, or GA/GTM.",
      confidence: "Partially Verified"
    });
  }

  if (!page.blog_link_detected) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Blog Presence",
      issue: "No blog/resources/articles link was detected on the audited page.",
      recommendation: "Create or expose an SEO-focused content section if organic content growth is a priority.",
      confidence: "Partially Verified"
    });
  }

  const socialCount = Object.values(page.social_profiles).reduce((count, urls) => count + urls.length, 0);
  if (socialCount === 0) {
    findings.push({
      severity: "Low",
      url,
      issue_type: "Social Media Presence",
      issue: "No supported social profile links were detected on the audited page.",
      recommendation: "Link verified social profiles from the footer or contact area where relevant.",
      confidence: "Partially Verified"
    });
  }

  unverifiedItems.add("Indexed pages require Google Search Console verification.");
  unverifiedItems.add("Duplicate content requires a site-wide crawl or duplicate-content tool.");
  unverifiedItems.add("Backlinks, spam score, and domain authority require Ahrefs, SEMrush, or Moz API access.");
}

function addCustom404Findings(url: string, custom404: Record<string, unknown>, findings: Finding[]): void {
  if (custom404.checked === true && custom404.proper_404_status === false) {
    findings.push({
      severity: "High",
      url: new URL(url).origin,
      issue_type: "Custom 404",
      issue: `Missing URL did not return HTTP 404; received ${String(custom404.status_code)}.`,
      recommendation: "Configure missing pages to return HTTP 404 while showing a helpful custom page.",
      confidence: "Verified"
    });
  }
}

function addPageSpeedFindings(url: string, summaries: PageSpeedSummary[], findings: Finding[], unverifiedItems: Set<string>): void {
  if (summaries.length === 0) {
    unverifiedItems.add("Performance metrics require PageSpeed Insights verification.");
    return;
  }

  for (const summary of summaries) {
    if (summary.performance_score !== null && summary.performance_score < 70) {
      findings.push({
        severity: summary.strategy === "mobile" ? "High" : "Medium",
        url,
        issue_type: "Page Speed",
        issue: `${summary.strategy} performance score is ${summary.performance_score}.`,
        recommendation: "Reduce render-blocking resources, optimize images/fonts, improve caching, and retest with PSI.",
        confidence: "Verified"
      });
    }
    if (summary.largest_contentful_paint_ms !== null && summary.largest_contentful_paint_ms > 2500) {
      findings.push({
        severity: "High",
        url,
        issue_type: "Core Web Vitals",
        issue: `${summary.strategy} LCP is ${Math.round(summary.largest_contentful_paint_ms)}ms.`,
        recommendation: "Optimize the largest above-the-fold element, preload critical assets, and reduce server/render delay.",
        confidence: "Verified"
      });
    }
    if (summary.cumulative_layout_shift !== null && summary.cumulative_layout_shift > 0.1) {
      findings.push({
        severity: "Medium",
        url,
        issue_type: "Core Web Vitals",
        issue: `${summary.strategy} CLS is ${summary.cumulative_layout_shift}.`,
        recommendation: "Reserve layout space for images, ads, embeds, and dynamic UI.",
        confidence: "Verified"
      });
    }
    if (summary.interaction_to_next_paint_ms !== null && summary.interaction_to_next_paint_ms > 200) {
      findings.push({
        severity: "Medium",
        url,
        issue_type: "Core Web Vitals",
        issue: `${summary.strategy} INP is ${Math.round(summary.interaction_to_next_paint_ms)}ms.`,
        recommendation: "Reduce long JavaScript tasks and defer non-critical scripts.",
        confidence: "Verified"
      });
    }
  }
}

function addUnavailableVerificationNotes(unverifiedItems: Set<string>): void {
  unverifiedItems.add("GA4 setup requires verification access when loaded through consent or server-side tagging.");
  unverifiedItems.add("Search Console integration and indexed page counts require Google Search Console access.");
  unverifiedItems.add("SSL grade requires SSL Labs API or equivalent TLS scanner access.");
}

function analyzeUrlStructure(url: URL): Record<string, unknown> {
  const issues: string[] = [];
  const full = url.toString();
  if (full.length > 70) issues.push(`URL is longer than 70 characters (${full.length}).`);
  if (url.pathname.includes("_")) issues.push("URL path contains underscores.");
  if (/[A-Z]/.test(url.pathname)) issues.push("URL path contains uppercase characters.");
  if (url.search) issues.push("URL contains dynamic query parameters.");
  if (!/[a-z0-9]/i.test(url.pathname.replace(/[/-]/g, ""))) issues.push("URL path is not readable.");
  return {
    length: full.length,
    has_underscores: url.pathname.includes("_"),
    has_uppercase: /[A-Z]/.test(url.pathname),
    has_dynamic_parameters: Boolean(url.search),
    issues
  };
}

function classifyTitle(title: string | null): Record<string, unknown> {
  return {
    value: title,
    missing: !title,
    under_40_characters: Boolean(title && title.length < 40),
    over_60_characters: Boolean(title && title.length > 60),
    duplicate_titles: "Unverified — requires site-wide crawl"
  };
}

function classifyMetaDescription(description: string | null): Record<string, unknown> {
  return {
    value: description,
    missing: !description,
    under_140_characters: Boolean(description && description.length < 140),
    over_160_characters: Boolean(description && description.length > 160),
    duplicate_descriptions: "Unverified — requires site-wide crawl"
  };
}

function summarizeImages(images: ImageSignal[]): ImageSummary {
  const missingAlt = images.filter((image) => image.src && (!image.alt || image.alt.trim() === "")).length;
  const missingLazy = images.filter((image) => image.src && image.loading?.toLowerCase() !== "lazy").length;
  const nonOptimized = images.filter((image) => image.format && !["webp", "avif", "svg"].includes(image.format)).length;
  return {
    total_images: images.length,
    missing_alt_count: missingAlt,
    missing_lazy_loading_count: missingLazy,
    non_optimized_format_count: nonOptimized,
    oversized_images: "Unverified — requires image HEAD checks or crawler export",
    recommendation: "Use WebP/AVIF where practical, compress images below 100KB where possible, and add ALT text."
  };
}

function summarizeCoreWebVitals(summaries: PageSpeedSummary[]): Record<string, unknown> {
  if (summaries.length === 0) {
    return {
      lcp: "Performance metrics require PageSpeed Insights verification.",
      cls: "Performance metrics require PageSpeed Insights verification.",
      inp: "Performance metrics require PageSpeed Insights verification."
    };
  }
  return Object.fromEntries(summaries.map((summary) => [
    summary.strategy,
    {
      lcp_ms: summary.largest_contentful_paint_ms,
      cls: summary.cumulative_layout_shift,
      inp_ms: summary.interaction_to_next_paint_ms
    }
  ]));
}

function buildPriorities(findings: Finding[]): TechnicalAuditReport["priority_recommendations"] {
  const immediate = findings
    .filter((finding) => finding.severity === "Critical" || finding.severity === "High")
    .slice(0, 8)
    .map((finding) => `${finding.issue_type}: ${finding.recommendation}`);
  const midTerm = findings
    .filter((finding) => finding.severity === "Medium")
    .slice(0, 8)
    .map((finding) => `${finding.issue_type}: ${finding.recommendation}`);
  const longTerm = findings
    .filter((finding) => finding.severity === "Low")
    .slice(0, 8)
    .map((finding) => `${finding.issue_type}: ${finding.recommendation}`);

  return {
    immediate_fixes_0_7_days: immediate.length ? uniqueStrings(immediate) : ["No critical or high-priority fixes were verified in this single-URL audit."],
    mid_term_improvements_7_30_days: midTerm.length ? uniqueStrings(midTerm) : ["Review metadata, schema, internal linking, and performance after broader crawl verification."],
    long_term_seo_strategy_30_90_days: longTerm.length ? uniqueStrings(longTerm) : ["Build crawl-scalable content, schema, internal linking, and monitoring workflows."]
  };
}

function buildBusinessImpact(findings: Finding[]): TechnicalAuditReport["business_impact_analysis"] {
  const hasCritical = findings.some((finding) => finding.severity === "Critical");
  const hasHigh = findings.some((finding) => finding.severity === "High");
  const hasPerformance = findings.some((finding) => ["Page Speed", "Core Web Vitals", "Mobile Friendly"].includes(finding.issue_type));
  const hasIndexability = findings.some((finding) => ["Indexability", "Robots.txt", "Canonicalization", "HTTP Status"].includes(finding.issue_type));
  const hasContent = findings.some((finding) => ["Meta Title", "Meta Description", "Heading Structure", "Structured Data", "Blog Presence"].includes(finding.issue_type));

  return {
    traffic_impact: hasIndexability ? "Potential organic traffic loss if crawlers cannot access, index, or consolidate the page correctly." : "No verified crawl-blocking traffic issue was found in this single-URL audit.",
    crawlability_impact: hasCritical || hasIndexability ? "Crawlability risk is elevated; fix verified blocking/status/canonical issues first." : "Crawlability risk appears limited for the audited URL, pending full-site crawl verification.",
    ux_impact: hasPerformance ? "Performance or mobile issues may reduce user engagement and satisfaction." : "No verified performance UX issue was found unless PSI verification was unavailable.",
    conversion_impact: hasHigh || hasPerformance ? "Technical friction may reduce conversions by slowing the page or weakening trust signals." : "Conversion impact appears low from verified technical checks, pending analytics review.",
    ranking_impact: hasCritical || hasHigh || hasContent ? "Ranking potential may be constrained by verified technical, metadata, content, or structured-data issues." : "Ranking risk appears low for the audited URL, but rankings themselves remain unverified without rank-tracking data."
  };
}

function countFindings(findings: Finding[]): Record<Severity, number> {
  return findings.reduce<Record<Severity, number>>((counts, finding) => {
    counts[finding.severity] += 1;
    return counts;
  }, { Critical: 0, High: 0, Medium: 0, Low: 0 });
}

function estimateHealthScore(findings: Finding[]): number {
  const penalties: Record<Severity, number> = { Critical: 18, High: 10, Medium: 5, Low: 2 };
  const score = findings.reduce((current, finding) => current - penalties[finding.severity], 100);
  return Math.max(0, score);
}

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<FetchSnapshot> {
  const env = getEnv();
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(env.TECHNICAL_AUDIT_TIMEOUT_MS),
    headers: {
      "user-agent": env.TECHNICAL_AUDIT_USER_AGENT,
      accept: headers.accept ?? "text/html,application/xhtml+xml,application/xml,text/xml,text/plain,*/*"
    }
  });
  const body = await response.text();
  return {
    requested_url: url,
    final_url: response.url,
    status_code: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type"),
    body
  };
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const env = getEnv();
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(env.TECHNICAL_AUDIT_TIMEOUT_MS),
    headers: {
      "user-agent": env.TECHNICAL_AUDIT_USER_AGENT,
      ...headers
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new AppError(text.slice(0, 500) || response.statusText, "HTTP_REQUEST_FAILED", response.status);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new AppError(`Invalid JSON response: ${errorMessage(error)}`, "INVALID_JSON_RESPONSE", response.status);
  }
}

function parseRobots(body: string, target: URL): Omit<RobotsAnalysis, "exists" | "status_code"> {
  const lines = body.split(/\r?\n/).map((line) => line.replace(/#.*/, "").trim()).filter(Boolean);
  const sitemapUrls: string[] = [];
  const groups: Array<{ agents: string[]; rules: Array<{ directive: "allow" | "disallow"; value: string }>; crawlDelay: number | null }> = [];
  let current: { agents: string[]; rules: Array<{ directive: "allow" | "disallow"; value: string }>; crawlDelay: number | null } | null = null;

  for (const line of lines) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "sitemap") {
      sitemapUrls.push(value);
      continue;
    }
    if (key === "user-agent") {
      if (current && current.rules.length === 0 && current.crawlDelay === null) {
        current.agents.push(value.toLowerCase());
      } else {
        current = { agents: [value.toLowerCase()], rules: [], crawlDelay: null };
        groups.push(current);
      }
      continue;
    }
    if (!current) continue;
    if (key === "allow" || key === "disallow") {
      current.rules.push({ directive: key, value });
    }
    if (key === "crawl-delay") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) current.crawlDelay = parsed;
    }
  }

  const matchingGroups = groups.filter((group) =>
    group.agents.some((agent) => agent === "*" || agent.includes("technicalseoauditmcp"))
  );
  const relevant = matchingGroups.length ? matchingGroups : groups.filter((group) => group.agents.includes("*"));
  const rules = relevant.flatMap((group) => group.rules);
  const crawlDelay = relevant.map((group) => group.crawlDelay).find((delay): delay is number => delay !== null) ?? null;
  const path = `${target.pathname}${target.search}`;
  const matchingAllows = rules.filter((rule) => rule.directive === "allow" && rule.value && robotsPatternMatches(rule.value, path));
  const matchingDisallows = rules.filter((rule) => rule.directive === "disallow" && rule.value && robotsPatternMatches(rule.value, path));
  const longestAllow = Math.max(0, ...matchingAllows.map((rule) => rule.value.length));
  const longestDisallow = Math.max(0, ...matchingDisallows.map((rule) => rule.value.length));
  const targetBlocked = longestDisallow > longestAllow;

  return {
    sitemap_urls: uniqueStrings(sitemapUrls),
    crawl_delay_seconds: crawlDelay,
    target_blocked: targetBlocked,
    blocking_rules: targetBlocked ? matchingDisallows.map((rule) => `Disallow: ${rule.value}`) : []
  };
}

function parsePageSpeedSummary(strategy: "mobile" | "desktop", data: unknown): PageSpeedSummary {
  const root = asRecord(data);
  const lighthouse = asRecord(root.lighthouseResult);
  const categories = asRecord(lighthouse.categories);
  const audits = asRecord(lighthouse.audits);
  const loadingExperience = asRecord(root.loadingExperience);
  const metrics = asRecord(loadingExperience.metrics);
  const inp = asRecord(metrics.INTERACTION_TO_NEXT_PAINT_MS);

  return {
    strategy,
    performance_score: categoryScore(asRecord(categories.performance)),
    seo_score: categoryScore(asRecord(categories.seo)),
    accessibility_score: categoryScore(asRecord(categories.accessibility)),
    best_practices_score: categoryScore(asRecord(categories["best-practices"])),
    largest_contentful_paint_ms: auditNumericValue(audits, "largest-contentful-paint"),
    cumulative_layout_shift: auditNumericValue(audits, "cumulative-layout-shift"),
    interaction_to_next_paint_ms: typeof inp.percentile === "number" ? inp.percentile : auditNumericValue(audits, "interactive"),
    viewport_passed: auditScore(audits, "viewport"),
    source: "Google PSI"
  };
}

function categoryScore(category: Record<string, unknown>): number | null {
  return typeof category.score === "number" ? Math.round(category.score * 100) : null;
}

function auditNumericValue(audits: Record<string, unknown>, key: string): number | null {
  const audit = asRecord(audits[key]);
  return typeof audit.numericValue === "number" ? audit.numericValue : null;
}

function auditScore(audits: Record<string, unknown>, key: string): boolean | null {
  const audit = asRecord(audits[key]);
  return typeof audit.score === "number" ? audit.score >= 0.9 : null;
}

function getMetaContent(html: string, name: string): string | null {
  const regex = /<meta\b([^>]*?)>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const attrs = match[1] ?? "";
    const metaName = getAttr(attrs, "name") ?? getAttr(attrs, "property");
    if (metaName?.toLowerCase() === name.toLowerCase()) {
      return cleanText(getAttr(attrs, "content"));
    }
  }
  return null;
}

function getLinkHref(html: string, rel: string): string | null {
  const regex = /<link\b([^>]*?)>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const attrs = match[1] ?? "";
    const relValue = getAttr(attrs, "rel");
    if (relValue?.toLowerCase().split(/\s+/).includes(rel.toLowerCase())) {
      return getAttr(attrs, "href");
    }
  }
  return null;
}

function getTagTexts(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const text = cleanText(stripHtml(match[1] ?? ""));
    if (text) values.push(text);
  }
  return values.slice(0, 25);
}

function extractImages(html: string): ImageSignal[] {
  const regex = /<img\b([^>]*?)>/gi;
  const images: ImageSignal[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const attrs = match[1] ?? "";
    const src = getAttr(attrs, "src") ?? getAttr(attrs, "data-src");
    images.push({
      src,
      alt: getAttr(attrs, "alt"),
      loading: getAttr(attrs, "loading"),
      format: getImageFormat(src)
    });
  }
  return images;
}

function extractLinks(html: string, baseUrl: string): LinkSignal[] {
  const regex = /<a\b([^>]*?)>/gi;
  const links: LinkSignal[] = [];
  const base = new URL(baseUrl);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const href = getAttr(match[1] ?? "", "href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const normalized = new URL(href, base);
      links.push({
        href,
        normalized_url: normalized.toString(),
        internal: normalized.hostname === base.hostname
      });
    } catch {
      links.push({ href, normalized_url: null, internal: false });
    }
  }
  return links;
}

function extractSchema(html: string): PageSignals["schema"] {
  const regex = /<script\b([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi;
  let blocks = 0;
  let valid = 0;
  let invalid = 0;
  const types = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    blocks += 1;
    try {
      const parsed = JSON.parse((match[2] ?? "").trim());
      valid += 1;
      for (const type of collectSchemaTypes(parsed)) types.add(type);
    } catch {
      invalid += 1;
    }
  }
  return {
    json_ld_blocks: blocks,
    valid_json_ld_blocks: valid,
    invalid_json_ld_blocks: invalid,
    types: Array.from(types).sort()
  };
}

function collectSchemaTypes(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectSchemaTypes);
  const record = asRecord(value);
  const values: string[] = [];
  const type = record["@type"];
  if (typeof type === "string") values.push(type);
  if (Array.isArray(type)) values.push(...type.filter((item): item is string => typeof item === "string"));
  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object") values.push(...collectSchemaTypes(nested));
  }
  return values;
}

function extractSocialProfiles(links: LinkSignal[]): Record<string, string[]> {
  const domains: Record<string, RegExp> = {
    facebook: /facebook\.com/i,
    instagram: /instagram\.com/i,
    linkedin: /linkedin\.com/i,
    twitter_x: /(twitter\.com|x\.com)/i,
    youtube: /youtube\.com|youtu\.be/i,
    pinterest: /pinterest\.com/i
  };
  const result = Object.fromEntries(Object.keys(domains).map((key) => [key, [] as string[]]));
  for (const link of links) {
    const normalized = link.normalized_url ?? link.href;
    for (const [name, pattern] of Object.entries(domains)) {
      if (pattern.test(normalized)) result[name]?.push(normalized);
    }
  }
  return Object.fromEntries(Object.entries(result).map(([name, urls]) => [name, uniqueStrings(urls)]));
}

function extractMixedContentUrls(html: string): string[] {
  const matches = html.match(/https?:\/\/[^"'\s<>]+/gi) ?? [];
  return uniqueStrings(matches.filter((url) => url.startsWith("http://"))).slice(0, 25);
}

function extractXmlLocs(xml: string): string[] {
  const locs: string[] = [];
  const regex = /<loc>\s*([\s\S]*?)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml))) {
    const loc = cleanText(match[1] ?? "");
    if (loc) locs.push(loc);
  }
  return uniqueStrings(locs);
}

function getAttr(attrs: string, name: string): string | null {
  const regex = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");
  const match = regex.exec(attrs);
  return match ? decodeHtml(match[2] ?? match[3] ?? match[4] ?? "") : null;
}

function getImageFormat(src: string | null): string | null {
  if (!src) return null;
  const path = src.split("?")[0] ?? src;
  const match = /\.([a-z0-9]+)$/i.exec(path);
  return match?.[1]?.toLowerCase() ?? null;
}

function firstMatch(text: string, regex: RegExp): string | null {
  return regex.exec(text)?.[1] ?? null;
}

function cleanText(text: string | null): string | null {
  if (text === null) return null;
  const cleaned = decodeHtml(text).replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function stripHtml(html: string): string {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function robotsPatternMatches(pattern: string, path: string): boolean {
  if (!pattern) return false;
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const suffix = escaped.endsWith("$") ? "" : ".*";
  return new RegExp(`^${escaped}${suffix}`).test(path);
}

function urlsEquivalent(a: string, b: string): boolean {
  try {
    const first = new URL(a);
    const second = new URL(b);
    return normalizeComparableUrl(first) === normalizeComparableUrl(second);
  } catch {
    return false;
  }
}

function normalizeComparableUrl(url: URL): string {
  const pathname = url.pathname.replace(/\/$/, "") || "/";
  return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}${url.search}`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function findScore(value: unknown): number | null {
  const record = asRecord(value);
  for (const key of ["score", "seo_score", "overall_score", "health_score"]) {
    const found = record[key];
    if (typeof found === "number" && found >= 0 && found <= 100) return Math.round(found);
  }
  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object") {
      const score = findScore(nested);
      if (score !== null) return score;
    }
  }
  return null;
}

function countFailedChecks(value: unknown): number | null {
  let seenChecks = 0;
  let failed = 0;
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      for (const child of item) visit(child);
      return;
    }
    const record = asRecord(item);
    if (Object.keys(record).length === 0) return;
    const status = record.status ?? record.result ?? record.passed;
    if (typeof status === "boolean") {
      seenChecks += 1;
      if (!status) failed += 1;
    } else if (typeof status === "string" && /fail|error|warning|bad/i.test(status)) {
      seenChecks += 1;
      failed += 1;
    }
    for (const child of Object.values(record)) visit(child);
  };
  visit(value);
  return seenChecks > 0 ? failed : null;
}

function errorMessage(error: unknown): string {
  if (error instanceof AppError) {
    const status = error.statusCode ? `HTTP ${error.statusCode}: ` : "";
    return `${status}${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
