import { RateLimitError } from '../utils/errors/custom-errors.js';

/**
 * Simple rate limiter to prevent excessive API requests.
 * Tracks request timestamps and enforces a maximum number of requests per time window.
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 100; // requests per window
  private readonly windowMs = 60 * 1000; // 1 minute window

  /**
   * Checks if the current request is within the rate limit.
   * Removes expired requests and checks if the limit has been exceeded.
   * @returns Promise that resolves if the request is allowed
   * @throws RateLimitError if the rate limit is exceeded
   */
  async checkLimit(): Promise<void> {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
        Math.ceil(waitTime / 1000)
      );
    }

    this.requests.push(now);
  }
}
