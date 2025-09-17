import { jest } from '@jest/globals';
import { Request, Response } from 'express';

import { HttpStatusCode } from '../../../types/constants';
import { HealthCheckResult, HealthStatus } from '../../../types/health';
import { logger } from '../../core/logger';
import { healthChecker } from '../health-checks';
import { getStatusCodeForHealth, healthCheckMiddleware } from './health-check.middleware';

// Mock dependencies
jest.mock('../../core/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Spy on logger.error
jest.spyOn(logger, 'error');

// Spy on healthChecker methods
jest.spyOn(healthChecker, 'runAllChecks');

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('getStatusCodeForHealth', () => {
  it('should return 200 for HEALTHY status', () => {
    expect(getStatusCodeForHealth(HealthStatus.HEALTHY)).toBe(HttpStatusCode.OK);
  });

  it('should return 200 for DEGRADED status', () => {
    expect(getStatusCodeForHealth(HealthStatus.DEGRADED)).toBe(HttpStatusCode.OK);
  });

  it('should return 503 for UNHEALTHY status', () => {
    expect(getStatusCodeForHealth(HealthStatus.UNHEALTHY)).toBe(HttpStatusCode.SERVICE_UNAVAILABLE);
  });

  it('should return 503 for unknown status', () => {
    expect(getStatusCodeForHealth('UNKNOWN' as HealthStatus)).toBe(HttpStatusCode.SERVICE_UNAVAILABLE);
  });
});

describe('healthCheckMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = {};
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
    jest.clearAllMocks();
  });

  it('should return health result with correct status code on success', async () => {
    const mockResult: HealthCheckResult = {
      status: HealthStatus.HEALTHY,
      timestamp: '2023-01-01T00:00:00.000Z',
      uptime: 12345,
      version: '1.0.0',
      checks: {},
    };
    (healthChecker.runAllChecks as jest.MockedFunction<typeof healthChecker.runAllChecks>).mockResolvedValue(
      mockResult
    );

    await healthCheckMiddleware(mockReq as Request, mockRes as Response);

    expect(healthChecker.runAllChecks).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect(mockJson).toHaveBeenCalledWith(mockResult);
  });

  it('should return 503 and error JSON on health check failure', async () => {
    const mockError = new Error('Check failed');
    (healthChecker.runAllChecks as jest.MockedFunction<typeof healthChecker.runAllChecks>).mockRejectedValue(mockError);

    await healthCheckMiddleware(mockReq as Request, mockRes as Response);

    expect(mockLogger.error).toHaveBeenCalledWith('Health check failed', { error: 'Check failed' });
    expect(mockStatus).toHaveBeenCalledWith(HttpStatusCode.SERVICE_UNAVAILABLE);
    expect(mockJson).toHaveBeenCalledWith({
      status: HealthStatus.UNHEALTHY,
      timestamp: expect.any(String),
      error: 'Health check system failure',
    });
  });

  it('should handle non-Error exceptions', async () => {
    (healthChecker.runAllChecks as jest.MockedFunction<typeof healthChecker.runAllChecks>).mockRejectedValue(
      'String error'
    );

    await healthCheckMiddleware(mockReq as Request, mockRes as Response);

    expect(mockLogger.error).toHaveBeenCalledWith('Health check failed', { error: 'String error' });
  });
});
