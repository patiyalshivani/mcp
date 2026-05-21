import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataForSeoClient } from "../services/dataforseoClient.js";
import { BacklinksAnalysisInputSchema } from "../schemas/backlinks.schema.js";
import { normalizeDomain, parseWithSchema } from "../utils/validators.js";
import { errorToToolResult } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { toolSuccess } from "./toolResult.js";

export function registerBacklinksAnalysisTool(server: McpServer, client: DataForSeoClient): void {
  server.registerTool(
    "backlinks_analysis",
    {
      title: "Backlinks Analysis",
      description: "Retrieve backlink profile summary and anchor text data for a domain using DataForSEO Backlinks API.",
      inputSchema: BacklinksAnalysisInputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true }
    },
    async (input) => {
      try {
        const args = parseWithSchema(BacklinksAnalysisInputSchema, input);
        const target = normalizeDomain(args.domain);
        logger.info({ tool: "backlinks_analysis", domain: target }, "Tool called");

        const [summary, anchors] = await Promise.all([
          client.post<Record<string, unknown>[]>("/v3/backlinks/summary/live", [{ target, include_subdomains: true }]),
          client.post<Record<string, unknown>[]>("/v3/backlinks/anchors/live", [{ target, include_subdomains: true, limit: args.limit }]).catch(() => undefined)
        ]);

        const summaryResult = firstResult(summary);
        const anchorItems = firstResult(anchors)?.items;

        return toolSuccess("Backlinks analysis completed.", {
          domain: target,
          backlinks: summaryResult.backlinks ?? summaryResult.backlinks_count ?? null,
          referring_domains: summaryResult.referring_domains ?? null,
          referring_pages: summaryResult.referring_pages ?? null,
          dofollow: summaryResult.dofollow ?? null,
          nofollow: summaryResult.nofollow ?? null,
          anchor_text: Array.isArray(anchorItems) ? anchorItems.slice(0, args.limit) : [],
          toxicity_metrics: {
            spam_score: summaryResult.spam_score ?? null,
            broken_backlinks: summaryResult.broken_backlinks ?? null
          },
          cost: summary.cost ?? null
        });
      } catch (error) {
        return errorToToolResult(error);
      }
    }
  );
}

function firstResult(response?: { tasks?: Array<{ result?: unknown }> }): Record<string, unknown> {
  const result = response?.tasks?.[0]?.result;
  if (Array.isArray(result)) return (result[0] as Record<string, unknown>) ?? {};
  return {};
}
