import { z } from "zod";

export const LocationSchema = z.string().min(2).default("United States").describe("DataForSEO location name, for example United States.");
export const LanguageSchema = z.string().min(2).default("English").describe("DataForSEO language name, for example English.");
export const LimitSchema = z.number().int().min(1).max(100).default(10).describe("Maximum number of normalized items to return.");

export const DomainSchema = z
  .string()
  .min(3)
  .regex(/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i, "Expected a valid domain or URL.");

export const UrlSchema = z.string().url();

export const ApiTaskSchema = z.object({
  id: z.string().optional(),
  status_code: z.number().optional(),
  status_message: z.string().optional(),
  result: z.unknown().optional()
});

export const DataForSeoBaseResponseSchema = z.object({
  status_code: z.number().optional(),
  status_message: z.string().optional(),
  tasks_count: z.number().optional(),
  tasks_error: z.number().optional(),
  cost: z.number().optional(),
  tasks: z.array(ApiTaskSchema).optional()
});

export type DataForSeoBaseResponse = z.infer<typeof DataForSeoBaseResponseSchema>;
