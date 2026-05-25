import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TechnicalAuditInputSchema } from "../schemas/technicalAudit.schema.js";
import { runTechnicalAudit } from "../services/technicalAudit.js";
import { parseWithSchema, normalizeUrl } from "../utils/validators.js";
import { errorToToolResult } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { toolSuccess } from "./toolResult.js";

export function registerTechnicalSeoAuditTool(server: McpServer): void {
  server.registerTool(
    "technical_seo_audit",
    {
      title: "Technical SEO Audit",
      description: "Run a technical SEO audit for a URL. Checks crawlability, indexability signals, metadata, canonicals, schema, analytics tags, mobile/performance verification, and prioritized findings.",
      inputSchema: TechnicalAuditInputSchema.shape,
      annotations: { readOnlyHint: true, idempotentHint: true }
    },
    async (input) => {
      try {
        const args = parseWithSchema(TechnicalAuditInputSchema, input);
        const url = normalizeUrl(args.url);
        logger.info({ tool: "technical_seo_audit", host: new URL(url).hostname }, "Tool called");

        const report = await runTechnicalAudit(url, {
          includePageSpeed: args.include_page_speed ?? true,
          includeOptionalApiChecks: args.include_optional_api_checks ?? true
        });

        return toolSuccess("Technical SEO audit completed.", report);
      } catch (error) {
        return errorToToolResult(error);
      }
    }
  );
}
