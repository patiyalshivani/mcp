export class RateLimiter {
  private active = 0;
  private queue: Array<() => void> = [];
  private lastStart = 0;

  constructor(
    private readonly maxConcurrency: number,
    private readonly minIntervalMs: number
  ) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.active -= 1;
      this.releaseNext();
    }
  }

  private async acquire(): Promise<void> {
    if (this.active >= this.maxConcurrency) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    const elapsed = Date.now() - this.lastStart;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }

    this.lastStart = Date.now();
    this.active += 1;
  }

  private releaseNext(): void {
    const next = this.queue.shift();
    if (next) next();
  }
}
