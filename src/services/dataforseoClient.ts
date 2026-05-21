import axios, { AxiosError, AxiosInstance } from "axios";
import { getEnv } from "../config/env.js";
import { getBasicAuthHeader } from "./auth.js";
import { MemoryCache } from "./cache.js";
import { RateLimiter } from "./rateLimiter.js";
import { withRetry } from "./retry.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export interface DataForSeoResponse<T = unknown> {
  version?: string;
  status_code?: number;
  status_message?: string;
  time?: string;
  cost?: number;
  tasks_count?: number;
  tasks_error?: number;
  tasks?: Array<{
    id?: string;
    status_code?: number;
    status_message?: string;
    result?: T;
    data?: unknown;
  }>;
}

export interface RequestOptions {
  cacheTtlSeconds?: number;
  skipCache?: boolean;
}

export class DataForSeoClient {
  private readonly axios: AxiosInstance;
  private readonly cache: MemoryCache;
  private readonly limiter: RateLimiter;
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor() {
    const env = getEnv();
    this.cache = new MemoryCache(env.DATAFORSEO_CACHE_TTL_SECONDS * 1000);
    this.limiter = new RateLimiter(env.DATAFORSEO_MAX_CONCURRENCY, Math.ceil(1000 / env.DATAFORSEO_RATE_LIMIT_PER_SECOND));
    this.axios = axios.create({
      baseURL: env.DATAFORSEO_BASE_URL.replace(/\/$/, ""),
      timeout: env.DATAFORSEO_TIMEOUT_MS,
      headers: {
        "content-type": "application/json",
        accept: "application/json"
      }
    });

    this.axios.interceptors.request.use((config) => {
      config.metadata = { startedAt: Date.now() };
      return config;
    });

    this.axios.interceptors.response.use(
      (response) => {
        const startedAt = response.config.metadata?.startedAt ?? Date.now();
        logger.info(
          {
            endpoint: response.config.url,
            status: response.status,
            latencyMs: Date.now() - startedAt
          },
          "DataForSEO API request completed"
        );
        return response;
      },
      (error: AxiosError) => {
        const startedAt = error.config?.metadata?.startedAt ?? Date.now();
        logger.warn(
          {
            endpoint: error.config?.url,
            status: error.response?.status,
            code: error.code,
            latencyMs: Date.now() - startedAt
          },
          "DataForSEO API request failed"
        );
        return Promise.reject(error);
      }
    );
  }

  async post<T>(path: string, payload: unknown, options: RequestOptions = {}): Promise<DataForSeoResponse<T>> {
    const cacheKey = this.cache.key(["POST", path, payload]);
    if (!options.skipCache) {
      const cached = this.cache.get<DataForSeoResponse<T>>(cacheKey);
      if (cached) return cached;

      const active = this.inFlight.get(cacheKey) as Promise<DataForSeoResponse<T>> | undefined;
      if (active) return active;
    }

    const request = this.limiter.run(() =>
      withRetry(
        async () => {
          const response = await this.axios.post<DataForSeoResponse<T>>(path, payload, {
            headers: { authorization: getBasicAuthHeader() }
          });
          const normalized = this.normalize(response.data);
          if (!options.skipCache) this.cache.set(cacheKey, normalized);
          return normalized;
        },
        {
          attempts: 3,
          baseDelayMs: 500,
          maxDelayMs: 5000,
          shouldRetry: shouldRetryRequest
        }
      )
    );

    if (!options.skipCache) this.inFlight.set(cacheKey, request);
    try {
      return await request;
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  private normalize<T>(response: DataForSeoResponse<T>): DataForSeoResponse<T> {
    if (!response || typeof response !== "object") {
      throw new AppError("Malformed DataForSEO response.", "DATAFORSEO_MALFORMED_RESPONSE");
    }
    if (response.status_code && response.status_code >= 40000) {
      throw new AppError(response.status_message ?? "DataForSEO returned an error.", "DATAFORSEO_API_ERROR", response.status_code, {
        tasks_error: response.tasks_error
      });
    }
    const failedTask = response.tasks?.find((task) => task.status_code && task.status_code >= 40000);
    if (failedTask) {
      throw new AppError(failedTask.status_message ?? "A DataForSEO task failed.", "DATAFORSEO_TASK_ERROR", failedTask.status_code, {
        task_id: failedTask.id
      });
    }
    return response;
  }
}

function shouldRetryRequest(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return error.code === "ECONNABORTED" || status === 408 || status === 429 || (typeof status === "number" && status >= 500);
}

declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startedAt: number;
    };
  }
}
