import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataForSeoClient } from "../services/dataforseoClient.js";
import { OnPageAnalysisInputSchema } from "../schemas/onpage.schema.js";
import { parseWithSchema, normalizeUrl } from "../utils/validators.js";
import { errorToToolResult } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { toolSuccess } from "./toolResult.js";

export function registerOnPageAnalysisTool(server: McpServer, client: DataForSeoClient): void {
  server.registerTool(
    "onpage_analysis",
    {
      title: "OnPage Analysis",
      description: "Analyze a URL with DataForSEO OnPage Instant Pages and return title, metadata, links, schema, status, and page metrics.",
      inputSchema: OnPageAnalysisInputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true }
    },
    async (input) => {
      try {
        const args = parseWithSchema(OnPageAnalysisInputSchema, input);
        const url = normalizeUrl(args.url);
        logger.info({ tool: "onpage_analysis", host: new URL(url).hostname }, "Tool called");

        const response = await client.post<Record<string, unknown>[]>(
          "/v3/on_page/instant_pages",
          [{ url, enable_javascript: true }]
        );

        const result = firstResult(response);
        const page = objectAt(result, "page");
        const meta = objectAt(page, "meta");
        const checks = objectAt(page, "checks");

        return toolSuccess("On-page analysis completed.", {
          url,
          status_code: page.status_code ?? result.status_code ?? null,
          title: meta.title ?? page.title ?? null,
          meta_description: meta.description ?? null,
          headings: meta.htags ?? null,
          schema: meta.structured_data ?? null,
          internal_links: page.internal_links_count ?? null,
          external_links: page.external_links_count ?? null,
          page_metrics: {
            size: page.size ?? null,
            encoded_size: page.encoded_size ?? null,
            total_transfer_size: page.total_transfer_size ?? null,
            content_encoding: page.content_encoding ?? null,
            response_time: page.time_to_interactive ?? page.fetch_time ?? null
          },
          checks,
          cost: response.cost ?? null
        });
      } catch (error) {
        return errorToToolResult(error);
      }
    }
  );
}

function firstResult(response: { tasks?: Array<{ result?: unknown }> }): Record<string, unknown> {
  const result = response.tasks?.[0]?.result;
  if (Array.isArray(result)) return (result[0] as Record<string, unknown>) ?? {};
  return {};
}

function objectAt(source: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = source[key];
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
