import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataForSeoClient } from "../services/dataforseoClient.js";
import { CompetitorsAnalysisInputSchema } from "../schemas/backlinks.schema.js";
import { normalizeDomain, parseWithSchema } from "../utils/validators.js";
import { errorToToolResult } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { toolSuccess } from "./toolResult.js";

export function registerCompetitorsAnalysisTool(server: McpServer, client: DataForSeoClient): void {
  server.registerTool(
    "competitors_analysis",
    {
      title: "Competitors Analysis",
      description: "Find organic search competitor domains and visibility comparison data using DataForSEO Labs.",
      inputSchema: CompetitorsAnalysisInputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true }
    },
    async (input) => {
      try {
        const args = parseWithSchema(CompetitorsAnalysisInputSchema, input);
        const target = normalizeDomain(args.domain);
        logger.info({ tool: "competitors_analysis", domain: target, location: args.location }, "Tool called");

        const response = await client.post<Record<string, unknown>[]>(
          "/v3/dataforseo_labs/google/competitors_domain/live",
          [
            {
              target,
              location_name: args.location,
              language_name: args.language,
              limit: args.limit
            }
          ]
        );

        const items = itemsFromFirstResult(response).slice(0, args.limit);
        const competitors = items.map((item) => ({
          domain: item.domain ?? null,
          avg_position: item.avg_position ?? null,
          sum_position: item.sum_position ?? null,
          intersections: item.intersections ?? null,
          metrics: item.metrics ?? null,
          full_domain_metrics: item.full_domain_metrics ?? null
        }));

        return toolSuccess("Competitors analysis completed.", {
          domain: target,
          location: args.location,
          language: args.language,
          competitor_domains: competitors,
          overlap_keywords: [],
          visibility_comparison: competitors.map((item) => ({
            domain: item.domain,
            intersections: item.intersections,
            avg_position: item.avg_position
          })),
          cost: response.cost ?? null
        });
      } catch (error) {
        return errorToToolResult(error);
      }
    }
  );
}

function itemsFromFirstResult(response: { tasks?: Array<{ result?: unknown }> }): Array<Record<string, unknown>> {
  const result = response.tasks?.[0]?.result;
  const first = Array.isArray(result) ? (result[0] as Record<string, unknown>) : {};
  return Array.isArray(first.items) ? (first.items as Array<Record<string, unknown>>) : [];
}
