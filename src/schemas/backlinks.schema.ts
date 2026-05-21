import { z } from "zod";
import { DomainSchema, LimitSchema } from "./common.schema.js";

export const BacklinksAnalysisInputSchema = z.object({
  domain: DomainSchema.describe("Domain, subdomain, or URL to analyze."),
  limit: LimitSchema
});

export type BacklinksAnalysisInput = z.infer<typeof BacklinksAnalysisInputSchema>;

export const CompetitorsAnalysisInputSchema = z.object({
  domain: DomainSchema.describe("Domain to find organic competitors for."),
  location: z.string().min(2).default("United States"),
  language: z.string().min(2).default("English"),
  limit: LimitSchema
});

export type CompetitorsAnalysisInput = z.infer<typeof CompetitorsAnalysisInputSchema>;
