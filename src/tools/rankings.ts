import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DataForSeoClient } from "../services/dataforseoClient.js";
import { RankingsInputSchema } from "../schemas/rankings.schema.js";
import { normalizeDomain, parseWithSchema } from "../utils/validators.js";
import { errorToToolResult } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { toolSuccess } from "./toolResult.js";

export function registerRankingsTool(server: McpServer, client: DataForSeoClient): void {
  server.registerTool(
    "ranked_keywords",
    {
      title: "Ranked Keywords",
      description: "Retrieve keywords a domain ranks for using DataForSEO Labs ranked keywords endpoint.",
      inputSchema: RankingsInputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true }
    },
    async (input) => {
      try {
        const args = parseWithSchema(RankingsInputSchema, input);
        const target = normalizeDomain(args.domain);
        logger.info({ tool: "ranked_keywords", domain: target, location: args.location }, "Tool called");

        const response = await client.post<Record<string, unknown>[]>(
          "/v3/dataforseo_labs/google/ranked_keywords/live",
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
        return toolSuccess("Ranked keywords retrieved.", {
          domain: target,
          location: args.location,
          language: args.language,
          keywords: items,
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
