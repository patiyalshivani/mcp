import { z } from "zod";
import { AppError } from "./errors.js";

export function parseWithSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("Invalid tool input.", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }
  return parsed.data;
}

export function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();
}

export function normalizeUrl(url: string): string {
  return new URL(url).toString();
}
