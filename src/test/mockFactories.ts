import { jest } from '@jest/globals';
import { AxiosInstance } from 'axios';

import { CacheManager } from '../cache/cache-manager.js';

// Small helpers to create typed jest mocked instances used by tests.
export function createMockAxiosInstance(baseURL?: string): jest.Mocked<AxiosInstance> {
  const mock = {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
    },
    defaults: { baseURL: baseURL ?? '' },
  } as unknown as jest.Mocked<AxiosInstance>;
  return mock;
}

export function createMockCacheManager(): jest.Mocked<CacheManager> {
  // Use an any-typed container here to avoid excessive type constraints from
  // jest.fn generic return types. Tests will typically override the behaviour
  // of these mocks as needed.
  const m: Record<string, unknown> = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getOrSet: jest.fn(),
    getStats: jest.fn(() => ({ size: 0, maxSize: 0, hitRate: 0, totalHits: 0, totalMisses: 0 })),
    stopCleanupTimer: jest.fn(),
  };
  return m as unknown as jest.Mocked<CacheManager>;
}

// Small helper to quickly create an AxiosResponse-like object for tests
export function axiosResponse<T>(data: T): import('axios').AxiosResponse<T> {
  return { data } as import('axios').AxiosResponse<T>;
}
