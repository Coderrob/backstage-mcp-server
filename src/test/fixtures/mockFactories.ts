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
import { jest } from '@jest/globals';
import { AxiosInstance } from 'axios';

import { CacheManager } from '../../domain/cache/cache-manager.js';

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
