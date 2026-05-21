import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataForSeoClient } from "../services/dataforseoClient.js";
import { KeywordResearchInputSchema } from "../schemas/keyword.schema.js";
import { parseWithSchema } from "../utils/validators.js";
import { errorToToolResult } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { toolSuccess } from "./toolResult.js";

export function registerKeywordResearchTool(server: McpServer, client: DataForSeoClient): void {
  server.registerTool(
    "keyword_research",
    {
      title: "Keyword Research",
      description: "Get DataForSEO keyword metrics including search volume, CPC, competition, keyword difficulty, and search intent.",
      inputSchema: KeywordResearchInputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true }
    },
    async (input) => {
      try {
        const args = parseWithSchema(KeywordResearchInputSchema, input);
        logger.info({ tool: "keyword_research", keyword: args.keyword, location: args.location }, "Tool called");

        const response = await client.post<Record<string, unknown>[]>(
          "/v3/dataforseo_labs/google/keyword_overview/live",
          [
            {
              keywords: [args.keyword],
              location_name: args.location,
              language_name: args.language
            }
          ]
        );

        const result = firstResult(response);
        const keywordInfo = objectAt(result, "keyword_info");
        const intentInfo = objectAt(result, "search_intent_info");
        const normalized = {
          keyword: args.keyword,
          location: args.location,
          language: args.language,
          search_volume: numberOrNull(keywordInfo.search_volume),
          cpc: numberOrNull(keywordInfo.cpc),
          competition: keywordInfo.competition_level ?? keywordInfo.competition ?? null,
          keyword_difficulty: numberOrNull(objectAt(result, "keyword_properties").keyword_difficulty),
          search_intent: intentInfo.main_intent ?? intentInfo.foreign_intent ?? null,
          raw_status: response.status_message,
          cost: response.cost ?? null
        };

        return toolSuccess("Keyword research completed.", normalized);
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

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

export const KeywordResearchOutputSchema = z.object({
  keyword: z.string(),
  location: z.string(),
  language: z.string(),
  search_volume: z.number().nullable(),
  cpc: z.number().nullable(),
  competition: z.unknown().nullable(),
  keyword_difficulty: z.number().nullable(),
  search_intent: z.unknown().nullable()
});
