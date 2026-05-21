import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "DATAFORSEO_PASSWORD",
      "password",
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
