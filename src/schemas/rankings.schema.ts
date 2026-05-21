import { z } from "zod";
import { DomainSchema, LanguageSchema, LimitSchema, LocationSchema } from "./common.schema.js";

export const RankingsInputSchema = z.object({
  domain: DomainSchema.describe("Domain, subdomain, or page target to retrieve ranked keywords for."),
  location: LocationSchema,
  language: LanguageSchema,
  limit: LimitSchema
});

export type RankingsInput = z.infer<typeof RankingsInputSchema>;
