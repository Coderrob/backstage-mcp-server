import { jest } from '@jest/globals';

import { HealthStatus } from '../../types/health.js'; // Assuming types are defined here
import { HealthChecker } from './health-checks.js';

// Mock dependencies
jest.mock('../core/logger');
jest.mock('../errors/error-handler');

describe('HealthChecker', () => {
  let checker: HealthChecker;

  beforeEach(() => {
    // Reset singleton for each test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HealthChecker as any).instance = null;
    checker = HealthChecker.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = HealthChecker.getInstance();
      const instance2 = HealthChecker.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('registerCheck', () => {
    it('should register a health check', () => {
      const mockCheck = jest
        .fn<() => Promise<{ status: HealthStatus; message: string; timestamp: string; duration: number }>>()
        .mockResolvedValue({
          status: HealthStatus.HEALTHY,
          message: 'ok',
          timestamp: '2023-01-01T00:00:00.000Z',
          duration: 0,
        });
      checker.registerCheck('test', mockCheck);
      expect(checker['checks'].has('test')).toBe(true);
    });
  });

  describe('runAllChecks', () => {
    it('should return healthy status when all checks pass', async () => {
      const mockCheck1 = jest
        .fn<() => Promise<{ status: HealthStatus; message: string; timestamp: string; duration: number }>>()
        .mockResolvedValue({
          status: HealthStatus.HEALTHY,
          message: 'ok',
          timestamp: '2023-01-01T00:00:00.000Z',
          duration: 0,
        });
      const mockCheck2 = jest
        .fn<() => Promise<{ status: HealthStatus; message: string; timestamp: string; duration: number }>>()
        .mockResolvedValue({
          status: HealthStatus.HEALTHY,
          message: 'ok',
          timestamp: '2023-01-01T00:00:00.000Z',
          duration: 0,
        });
      checker.registerCheck('check1', mockCheck1);
      checker.registerCheck('check2', mockCheck2);

      const result = await checker.runAllChecks();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.checks.check1.status).toBe(HealthStatus.HEALTHY);
      expect(result.checks.check2.status).toBe(HealthStatus.HEALTHY);
    });

    it('should return degraded status when one check is degraded', async () => {
      const mockCheck1 = jest
        .fn<() => Promise<{ status: HealthStatus; message: string; timestamp: string; duration: number }>>()
        .mockResolvedValue({
          status: HealthStatus.HEALTHY,
          message: 'ok',
          timestamp: '2023-01-01T00:00:00.000Z',
          duration: 0,
        });
      const mockCheck2 = jest
        .fn<() => Promise<{ status: HealthStatus; message: string; timestamp: string; duration: number }>>()
        .mockResolvedValue({
          status: HealthStatus.DEGRADED,
          message: 'degraded',
          timestamp: '2023-01-01T00:00:00.000Z',
          duration: 0,
        });
      checker.registerCheck('check1', mockCheck1);
      checker.registerCheck('check2', mockCheck2);

      const result = await checker.runAllChecks();
      expect(result.status).toBe(HealthStatus.DEGRADED);
    });

    it('should return unhealthy status when one check fails', async () => {
      const mockCheck1 = jest
        .fn<() => Promise<{ status: HealthStatus; message: string; timestamp: string; duration: number }>>()
        .mockResolvedValue({
          status: HealthStatus.HEALTHY,
          message: 'ok',
          timestamp: '2023-01-01T00:00:00.000Z',
          duration: 0,
        });
      const mockCheck2 = jest
        .fn<() => Promise<{ status: HealthStatus; message: string; timestamp: string; duration: number }>>()
        .mockRejectedValue(new Error('Test error'));
      checker.registerCheck('check1', mockCheck1);
      checker.registerCheck('check2', mockCheck2);

      const result = await checker.runAllChecks();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.checks.check2.status).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe('getUptime', () => {
    it('should return uptime in seconds', () => {
      const initialTime = checker['startTime'].getTime();
      jest.spyOn(Date, 'now').mockReturnValue(initialTime + 5000); // 5 seconds later
      expect(checker.getUptime()).toBe(5);
    });
  });
});
