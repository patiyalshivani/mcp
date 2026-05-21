import { z } from "zod";
import { UrlSchema } from "./common.schema.js";

export const OnPageAnalysisInputSchema = z.object({
  url: UrlSchema.describe("Full URL to analyze with DataForSEO OnPage Instant Pages.")
});

export type OnPageAnalysisInput = z.infer<typeof OnPageAnalysisInputSchema>;
