import { CacheConfig, CacheEntry } from '../types/cache.js';
import { isNumber } from '../utils/core/guards.js';
import { logger } from '../utils/core/logger.js';

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
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
    if (entry === undefined || entry === null) {
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

    if (oldestKey !== undefined && oldestKey !== null) {
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
