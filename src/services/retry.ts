import { logger } from "../utils/logger.js";

export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry: (error: unknown) => boolean;
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= options.attempts || !options.shouldRetry(error)) break;

      const delay = jitter(Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** (attempt - 1)));
      logger.warn({ attempt, delay }, "Retrying API request");
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function jitter(delayMs: number): number {
  const factor = 0.75 + Math.random() * 0.5;
  return Math.round(delayMs * factor);
}
