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

import { HealthStatus } from '../../shared/types/health.js'; // Assuming types are defined here
import { HealthTestUtils } from '../../test/helpers/test-utils.js';
import { HealthChecker } from './health-checker.js';

// Mock dependencies
jest.mock('../../shared/utils/logger');
jest.mock('../../shared/utils/error-handler');

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
      const mockCheck = HealthTestUtils.createMockHealthCheck();
      checker.registerCheck('test', mockCheck);
      expect(checker['checks'].has('test')).toBe(true);
    });
  });

  describe('runAllChecks', () => {
    it('should return healthy status when all checks pass', async () => {
      const mockCheck1 = HealthTestUtils.createMockHealthCheck();
      const mockCheck2 = HealthTestUtils.createMockHealthCheck();
      checker.registerCheck('check1', mockCheck1);
      checker.registerCheck('check2', mockCheck2);

      const result = await checker.runAllChecks();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.checks.check1.status).toBe(HealthStatus.HEALTHY);
      expect(result.checks.check2.status).toBe(HealthStatus.HEALTHY);
    });

    it('should return degraded status when one check is degraded', async () => {
      const mockCheck1 = HealthTestUtils.createMockHealthCheck();
      const mockCheck2 = HealthTestUtils.createMockHealthCheck({
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
      const mockCheck1 = HealthTestUtils.createMockHealthCheck();
      const mockCheck2 = HealthTestUtils.createMockHealthCheck();
      mockCheck2.mockRejectedValue(new Error('Test error'));
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
