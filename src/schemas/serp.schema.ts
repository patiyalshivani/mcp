import { z } from "zod";
import { LanguageSchema, LimitSchema, LocationSchema } from "./common.schema.js";

export const SerpAnalysisInputSchema = z.object({
  keyword: z.string().min(1).max(250).describe("Keyword to retrieve live Google organic SERP results for."),
  location: LocationSchema,
  language: LanguageSchema,
  device: z.enum(["desktop", "mobile"]).default("desktop"),
  limit: LimitSchema
});

export type SerpAnalysisInput = z.infer<typeof SerpAnalysisInputSchema>;
