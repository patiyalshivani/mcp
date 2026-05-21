import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataForSeoClient } from "../services/dataforseoClient.js";
import { SerpAnalysisInputSchema } from "../schemas/serp.schema.js";
import { parseWithSchema } from "../utils/validators.js";
import { errorToToolResult } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { toolSuccess } from "./toolResult.js";

export function registerSerpAnalysisTool(server: McpServer, client: DataForSeoClient): void {
  server.registerTool(
    "serp_analysis",
    {
      title: "SERP Analysis",
      description: "Fetch live Google organic SERP results and normalize rankings, featured snippets, SERP features, and top pages.",
      inputSchema: SerpAnalysisInputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true }
    },
    async (input) => {
      try {
        const args = parseWithSchema(SerpAnalysisInputSchema, input);
        logger.info({ tool: "serp_analysis", keyword: args.keyword, location: args.location }, "Tool called");

        const response = await client.post<Record<string, unknown>[]>(
          "/v3/serp/google/organic/live/advanced",
          [
            {
              keyword: args.keyword,
              location_name: args.location,
              language_name: args.language,
              device: args.device,
              depth: Math.max(args.limit, 10)
            }
          ],
          { cacheTtlSeconds: 1800 }
        );

        const taskResult = firstResult(response);
        const items = Array.isArray(taskResult.items) ? taskResult.items : [];
        const topRankingPages = items
          .filter((item) => isObject(item) && item.type === "organic")
          .slice(0, args.limit)
          .map((item) => ({
            rank_absolute: item.rank_absolute ?? null,
            rank_group: item.rank_group ?? null,
            domain: item.domain ?? null,
            title: item.title ?? null,
            url: item.url ?? null,
            description: item.description ?? null
          }));

        const serpFeatures = [...new Set(items.filter(isObject).map((item) => String(item.type)).filter(Boolean))];
        const featuredSnippets = items.filter((item) => isObject(item) && String(item.type).includes("featured")).slice(0, args.limit);

        return toolSuccess("SERP analysis completed.", {
          keyword: args.keyword,
          location: args.location,
          language: args.language,
          top_ranking_pages: topRankingPages,
          featured_snippets: featuredSnippets,
          serp_features: serpFeatures,
          rankings: topRankingPages,
          domain_metrics: [],
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

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}
