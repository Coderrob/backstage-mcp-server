export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
}

export interface CacheConfig {
  defaultTtl: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // Cleanup interval in milliseconds
}
