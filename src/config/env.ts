import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env")
});

const EnvSchema = z.object({
  SEOSCORE_API_KEY: z.string().default(""),
  PSI_API_KEY: z.string().default(""),
  TECHNICAL_AUDIT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  TECHNICAL_AUDIT_USER_AGENT: z.string().default("TechnicalSeoAuditMcp/1.0"),
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
