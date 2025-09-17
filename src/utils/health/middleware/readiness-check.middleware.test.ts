import { jest } from '@jest/globals';
import { Request, Response } from 'express';

import { HttpStatusCode } from '../../../types/constants.js';
import { HealthCheckResult, HealthStatus } from '../../../types/health.js';
import { logger } from '../../../utils/core/logger.js';
import { healthChecker } from '../health-checks.js';
import { readinessCheckMiddleware } from './readiness-check.middleware';

// Mock dependencies
jest.mock('../../../types/constants.js');
jest.mock('../../../types/health.js');
jest.mock('../../../utils/core/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Spy on healthChecker methods
jest.spyOn(healthChecker, 'runAllChecks');
// Spy on logger methods
jest.spyOn(logger, 'error');

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('readinessCheckMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {};
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  it('should return 200 and ready status when health checks pass', async () => {
    const mockResult = {
      status: HealthStatus.HEALTHY,
      uptime: 12345,
      timestamp: '2023-01-01T00:00:00.000Z',
      version: '1.0.0',
      checks: {},
    };
    (healthChecker.runAllChecks as jest.MockedFunction<typeof healthChecker.runAllChecks>).mockResolvedValue(
      mockResult
    );

    await readinessCheckMiddleware(mockReq as Request, mockRes as Response);

    expect(healthChecker.runAllChecks).toHaveBeenCalledTimes(1);
    expect(statusMock).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect(jsonMock).toHaveBeenCalledWith({
      status: 'ready',
      timestamp: expect.any(String),
      uptime: 12345,
    });
  });

  it('should return 503 and unhealthy status when health checks fail', async () => {
    const mockResult: HealthCheckResult = {
      status: HealthStatus.UNHEALTHY,
      uptime: 0,
      timestamp: '2023-01-01T00:00:00.000Z',
      version: '1.0.0',
      checks: {},
    };
    (healthChecker.runAllChecks as jest.MockedFunction<typeof healthChecker.runAllChecks>).mockResolvedValue(
      mockResult
    );

    await readinessCheckMiddleware(mockReq as Request, mockRes as Response);

    expect(healthChecker.runAllChecks).toHaveBeenCalledTimes(1);
    expect(statusMock).toHaveBeenCalledWith(HttpStatusCode.SERVICE_UNAVAILABLE);
    expect(jsonMock).toHaveBeenCalledWith({
      status: HealthStatus.UNHEALTHY,
      message: 'Service is not ready',
      timestamp: expect.any(String),
    });
  });

  it('should return 503 and unhealthy status when health checks throw an error', async () => {
    const error = new Error('Test error');
    (healthChecker.runAllChecks as jest.MockedFunction<typeof healthChecker.runAllChecks>).mockRejectedValue(error);

    await readinessCheckMiddleware(mockReq as Request, mockRes as Response);

    expect(healthChecker.runAllChecks).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('Readiness check failed', {
      error: 'Test error',
    });
    expect(statusMock).toHaveBeenCalledWith(HttpStatusCode.SERVICE_UNAVAILABLE);
    expect(jsonMock).toHaveBeenCalledWith({
      status: HealthStatus.UNHEALTHY,
      message: 'Readiness check failed',
      timestamp: expect.any(String),
    });
  });

  it('should handle non-Error thrown values in error case', async () => {
    const error = 'String error';
    (healthChecker.runAllChecks as jest.MockedFunction<typeof healthChecker.runAllChecks>).mockRejectedValue(error);

    await readinessCheckMiddleware(mockReq as Request, mockRes as Response);

    expect(mockLogger.error).toHaveBeenCalledWith('Readiness check failed', {
      error: 'String error',
    });
  });
});
