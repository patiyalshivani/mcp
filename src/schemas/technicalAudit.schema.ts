import { z } from "zod";
import { UrlSchema } from "./common.schema.js";

export const TechnicalAuditInputSchema = z.object({
  url: UrlSchema.describe("Full public URL to audit."),
  include_page_speed: z.boolean().default(true).describe("Run Google PageSpeed Insights checks when available."),
  include_optional_api_checks: z.boolean().default(true).describe("Use optional configured APIs such as SEO Score API.")
});

export type TechnicalAuditInput = z.infer<typeof TechnicalAuditInputSchema>;
