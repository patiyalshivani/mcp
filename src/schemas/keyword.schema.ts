import { z } from "zod";
import { LanguageSchema, LimitSchema, LocationSchema } from "./common.schema.js";

export const KeywordResearchInputSchema = z.object({
  keyword: z.string().min(1).max(250).describe("Seed keyword or exact keyword to analyze."),
  location: LocationSchema,
  language: LanguageSchema,
  limit: LimitSchema
});

export type KeywordResearchInput = z.infer<typeof KeywordResearchInputSchema>;
