import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  DATAFORSEO_LOGIN: z.string().default(""),
  DATAFORSEO_PASSWORD: z.string().default(""),
  DATAFORSEO_BASE_URL: z.string().url().default("https://api.dataforseo.com"),
  DATAFORSEO_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  DATAFORSEO_RATE_LIMIT_PER_SECOND: z.coerce.number().int().positive().default(3),
  DATAFORSEO_MAX_CONCURRENCY: z.coerce.number().int().positive().default(5),
  DATAFORSEO_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(3600),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info")
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = EnvSchema.parse(process.env);
  }
  return cachedEnv;
}
