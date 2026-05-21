import { getEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export function getBasicAuthHeader(): string {
  const env = getEnv();
  if (!env.DATAFORSEO_LOGIN || !env.DATAFORSEO_PASSWORD) {
    throw new AppError("DataForSEO credentials are not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.", "DATAFORSEO_CONFIG_ERROR", 500);
  }
  const token = Buffer.from(`${env.DATAFORSEO_LOGIN}:${env.DATAFORSEO_PASSWORD}`, "utf8").toString("base64");
  return `Basic ${token}`;
}
