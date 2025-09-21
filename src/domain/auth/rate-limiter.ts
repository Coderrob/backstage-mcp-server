/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { RateLimitError } from '../../shared/utils/custom-errors.js';

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
