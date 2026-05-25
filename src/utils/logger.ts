import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "SEOSCORE_API_KEY",
      "PSI_API_KEY",
      "SEMRUSH_API_KEY",
      "password",
      "*apiKey",
      "*.apiKey",
      "*.password",
      "authorization",
      "headers.authorization",
      "config.auth.password",
      "config.headers.authorization"
    ],
    censor: "[REDACTED]"
  },
  base: undefined
}, pino.destination(2));
