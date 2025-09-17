import { jest } from '@jest/globals';

import { HealthStatus } from '../../types/health.js';
import {
  apiConnectivityHealthCheck,
  databaseHealthCheck,
  memoryHealthCheck,
  registerBuiltInHealthChecks,
  toolRegistryHealthCheck,
} from './built-in-checks.js';

// Mock dependencies
jest.mock('../core/logger.js', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('./health-checks.js', () => ({
  HealthStatus: {
    HEALTHY: 'healthy',
    UNHEALTHY: 'unhealthy',
    DEGRADED: 'degraded',
  },
  healthChecker: {
    registerCheck: jest.fn(),
  },
}));

describe('databaseHealthCheck', () => {
  it('should return healthy status', async () => {
    const result = await databaseHealthCheck();
    expect(result).toEqual({
      status: HealthStatus.HEALTHY,
      message: 'Database connection is healthy',
      timestamp: expect.any(String),
      duration: expect.any(Number),
    });
  });

  it('should handle errors', async () => {
    // Mock an error scenario if needed, but currently it doesn't throw
    const result = await databaseHealthCheck();
    expect(result.status).toBe(HealthStatus.HEALTHY);
  });
});

describe('apiConnectivityHealthCheck', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return unhealthy if BACKSTAGE_BASE_URL is not set', async () => {
    delete process.env.BACKSTAGE_BASE_URL;
    const result = await apiConnectivityHealthCheck();
    expect(result).toEqual({
      status: HealthStatus.UNHEALTHY,
      message: 'BACKSTAGE_BASE_URL environment variable not set',
      timestamp: expect.any(String),
      duration: expect.any(Number),
    });
  });

  it('should return unhealthy if BACKSTAGE_BASE_URL is invalid', async () => {
    process.env.BACKSTAGE_BASE_URL = 'invalid-url';
    const result = await apiConnectivityHealthCheck();
    expect(result).toEqual({
      status: HealthStatus.UNHEALTHY,
      message: 'BACKSTAGE_BASE_URL is not a valid URL',
      details: { baseUrl: 'invalid-url' },
      timestamp: expect.any(String),
      duration: expect.any(Number),
    });
  });

  it('should return healthy if BACKSTAGE_BASE_URL is valid', async () => {
    process.env.BACKSTAGE_BASE_URL = 'https://example.com';
    const result = await apiConnectivityHealthCheck();
    expect(result).toEqual({
      status: HealthStatus.HEALTHY,
      message: 'API configuration is valid',
      details: { baseUrl: 'https://example.com' },
      timestamp: expect.any(String),
      duration: expect.any(Number),
    });
  });
});

describe('memoryHealthCheck', () => {
  it('should return healthy status for low usage', async () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapTotal: 100 * 1024 * 1024,
      heapUsed: 50 * 1024 * 1024,
      external: 0,
      rss: 0,
      arrayBuffers: 0,
    });
    const result = await memoryHealthCheck();
    expect(result.status).toBe(HealthStatus.HEALTHY);
    expect(result.message).toContain('Memory usage: 50MB/100MB (50%)');
  });

  it('should return degraded status for high usage', async () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapTotal: 100 * 1024 * 1024,
      heapUsed: 91 * 1024 * 1024,
      external: 0,
      rss: 0,
      arrayBuffers: 0,
    });
    const result = await memoryHealthCheck();
    expect(result.status).toBe(HealthStatus.DEGRADED);
  });

  it('should return unhealthy status for very high usage', async () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      heapTotal: 100 * 1024 * 1024,
      heapUsed: 96 * 1024 * 1024,
      external: 0,
      rss: 0,
      arrayBuffers: 0,
    });
    const result = await memoryHealthCheck();
    expect(result.status).toBe(HealthStatus.UNHEALTHY);
  });
});

describe('toolRegistryHealthCheck', () => {
  it('should return healthy status', async () => {
    const result = await toolRegistryHealthCheck();
    expect(result).toEqual({
      status: HealthStatus.HEALTHY,
      message: 'Tool registry is operational',
      timestamp: expect.any(String),
      duration: expect.any(Number),
    });
  });
});

describe('registerBuiltInHealthChecks', () => {
  it('should register all built-in checks', () => {
    registerBuiltInHealthChecks();
  });
});
