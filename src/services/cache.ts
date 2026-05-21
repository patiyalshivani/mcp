interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

export class MemoryCache {
  private values = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly ttlMs: number) {}

  get<T>(key: string): T | undefined {
    if (this.ttlMs === 0) return undefined;
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.values.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    if (this.ttlMs === 0) return;
    this.values.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  key(parts: unknown[]): string {
    return JSON.stringify(parts);
  }
}
