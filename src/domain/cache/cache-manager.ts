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

import { ICacheConfig, ICacheEntry } from '../../shared/types/cache.js';
import { isDefined, isNullOrUndefined, isNumber } from '../../shared/utils/guards.js';
import { logger } from '../../shared/utils/logger.js';

export class CacheManager {
  private cache = new Map<string, ICacheEntry>();
  private config: ICacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<ICacheConfig> = {}) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      cleanupInterval: 60 * 1000, // 1 minute cleanup
      ...config,
    };

    this.startCleanupTimer();
    logger.debug('CacheManager initialized', {
      defaultTtl: this.config.defaultTtl,
      maxSize: this.config.maxSize,
      cleanupInterval: this.config.cleanupInterval,
    });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (isNullOrUndefined(entry)) {
      logger.debug(`Cache miss for key: ${key}`);
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      logger.debug(`Cache entry expired for key: ${key}`);
      this.cache.delete(key);
      return undefined;
    }

    // Increment hit counter
    entry.hits++;
    logger.debug(`Cache hit for key: ${key} (hits: ${entry.hits})`);
    return entry.data as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict oldest entries if at capacity
    if (isNumber(this.config.maxSize) && this.cache.size >= this.config.maxSize) {
      logger.debug('Cache at capacity, evicting oldest entry');
      this.evictOldest();
    }

    const finalTtl = isNumber(ttl) && !Number.isNaN(ttl) ? ttl : this.config.defaultTtl;
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: finalTtl,
      hits: 0,
    });
    logger.debug(`Cache entry set for key: ${key} (ttl: ${finalTtl}ms)`);
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  } {
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalRequests += entry.hits + 1; // +1 for the initial set
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalHits,
      totalMisses: totalRequests - totalHits,
    };
  }

  /**
   * Get or set with a fetcher function
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    let value = this.get<T>(key);
    if (value !== undefined) {
      return value;
    }

    logger.debug(`Cache miss, fetching data for key: ${key}`);
    value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }

  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (isDefined(oldestKey)) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const initialSize = this.cache.size;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    const removed = initialSize - this.cache.size;
    if (removed > 0) {
      logger.debug(`Cache cleanup removed ${removed} expired entries`);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);

    // Prevent the cleanup timer from keeping the Node.js event loop alive
    // during tests or graceful shutdowns.
    if (this.cleanupTimer) {
      const t = this.cleanupTimer as NodeJS.Timeout & { unref?: () => void };
      if (typeof t.unref === 'function') t.unref();
    }
  }

  /**
   * Stop the cleanup timer (useful for testing or shutdown)
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
