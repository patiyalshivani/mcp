import { z } from "zod";
import { UrlSchema } from "./common.schema.js";

export const TechnicalAuditInputSchema = z.object({
  url: UrlSchema.describe("Full public URL to audit."),
  include_page_speed: z.boolean().default(true).describe("Run Google PageSpeed Insights checks when available."),
  include_optional_api_checks: z.boolean().default(true).describe("Use optional configured APIs such as SEO Score API and Semrush-compatible domain ranks."),
  include_word_document: z.boolean().default(true).describe("Include a Word-compatible HTML audit document in the response.")
});

export type TechnicalAuditInput = z.infer<typeof TechnicalAuditInputSchema>;
