import { jest } from '@jest/globals';

import { CacheManager } from './cache-manager.js';

// Mock logger
jest.mock('../utils/core/logger.js', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

type CacheManagerWithPrivate = {
  cleanup(): void;

  getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>;

  get<T>(key: string): T | undefined;

  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
};

describe('CacheManager', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.useRealTimers();
  });

  let cache: CacheManager;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = new CacheManager();
  });

  afterEach(() => {
    cache.stopCleanupTimer();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const cache = new CacheManager();
      expect(cache).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const cache = new CacheManager({
        defaultTtl: 1000,
        maxSize: 10,
        cleanupInterval: 5000,
      });
      expect(cache).toBeDefined();
    });
  });

  describe('get and set', () => {
    it('should return undefined for missing key', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should set and get a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should handle different types', () => {
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('object', { foo: 'bar' });

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('object')).toEqual({ foo: 'bar' });
    });

    it('should respect custom ttl', () => {
      cache.set('key', 'value', 1000);
      expect(cache.get('key')).toBe('value');

      jest.advanceTimersByTime(1001);
      expect(cache.get('key')).toBeUndefined();
    });

    it('should use default ttl', () => {
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');

      jest.advanceTimersByTime(5 * 60 * 1000 + 1); // 5 min + 1ms
      expect(cache.get('key')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key', 'value');
      expect(cache.delete('key')).toBe(true);
      expect(cache.get('key')).toBeUndefined();
    });

    it('should return false for non-existing key', () => {
      expect(cache.delete('missing')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');

      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return correct stats for empty cache', () => {
      const stats = cache.getStats();
      expect(stats).toEqual({
        size: 0,
        maxSize: 1000,
        hitRate: 0,
        totalHits: 0,
        totalMisses: 0,
      });
    });

    it('should return correct stats with entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // First access - miss
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('missing'); // miss

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.totalHits).toBe(2);
      expect(stats.totalMisses).toBe(2); // 4 requests - 2 hits
      expect(stats.hitRate).toBe(2 / 4); // 2 hits / 4 requests
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('key', 'cached');
      const fetcher = jest.fn();

      const result = await (cache as unknown as CacheManagerWithPrivate).getOrSet(
        'key',
        fetcher as () => Promise<string>
      );

      expect(result).toBe('cached');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not exists', async () => {
      const fetcher = jest.fn<() => Promise<string>>().mockResolvedValue('fetched');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (cache as unknown as CacheManagerWithPrivate).getOrSet('key', fetcher as () => Promise<any>);

      expect(result).toBe('fetched');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(cache.get('key')).toBe('fetched');
    });

    it('should use custom ttl for fetcher', async () => {
      const fetcher = jest.fn<() => Promise<string>>().mockResolvedValue('fetched');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (cache as unknown as CacheManagerWithPrivate).getOrSet('key', fetcher as () => Promise<any>, 1000);
      expect(cache.get('key')).toBe('fetched');

      jest.advanceTimersByTime(1001);
      expect(cache.get('key')).toBeUndefined();
    });
  });

  describe('eviction', () => {
    it('should evict oldest when at capacity', () => {
      const smallCache = new CacheManager({ maxSize: 2 });

      smallCache.set('key1', 'value1');
      jest.advanceTimersByTime(1);
      smallCache.set('key2', 'value2');
      jest.advanceTimersByTime(1);
      smallCache.set('key3', 'value3'); // should evict key1

      expect(smallCache.get('key1')).toBeUndefined();
      expect(smallCache.get('key2')).toBe('value2');
      expect(smallCache.get('key3')).toBe('value3');
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired entries', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 2000);

      jest.advanceTimersByTime(1500);

      // Trigger cleanup manually (since timer is mocked)
      (cache as unknown as CacheManagerWithPrivate).cleanup();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });
  });
});
