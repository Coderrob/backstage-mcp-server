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

import { beforeEach, expect, jest } from '@jest/globals';
import { Request, Response } from 'express';

import { HttpStatusCode } from '../../shared/types/constants.js';
import { HealthStatus, IHealthCheckResult } from '../../shared/types/health.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Mock setup utilities for common testing patterns
 */
export class TestUtils {
  /**
   * Creates a mock Express Request object
   */
  static createMockRequest(overrides: Partial<Request> = {}): jest.Mocked<Request> {
    return {
      ...overrides,
    } as jest.Mocked<Request>;
  }

  /**
   * Creates a mock Express Response object with json and status methods
   */
  static createMockResponse(): {
    response: jest.Mocked<Response>;
    jsonMock: jest.Mock;
    statusMock: jest.Mock;
  } {
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    const response = {
      status: statusMock,
      json: jsonMock,
      ...jest.fn(),
    } as unknown as jest.Mocked<Response>;

    return { response, jsonMock, statusMock };
  }

  /**
   * Sets up common logger mocks for testing
   * Note: This assumes the logger module has already been mocked with jest.mock
   */
  static setupLoggerMocks(): jest.Mocked<Pick<typeof logger, 'debug' | 'info' | 'error' | 'warn'>> {
    // Access the mocked logger - this will be the mocked version if jest.mock is set up
    const mockLogger = jest.mocked(logger);
    return mockLogger;
  }

  /**
   * Creates a standard health check result for testing
   */
  static createMockHealthResult(overrides: Partial<IHealthCheckResult> = {}): IHealthCheckResult {
    return {
      status: HealthStatus.HEALTHY,
      timestamp: '2023-01-01T00:00:00.000Z',
      uptime: 12345,
      version: '1.0.0',
      checks: {},
      ...overrides,
    };
  }

  /**
   * Common test setup that clears all mocks
   */
  static setupTestEnvironment(): void {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  }

  /**
   * Asserts that a middleware returned a successful JSON response
   */
  static expectJsonResponse(
    statusMock: jest.Mock,
    jsonMock: jest.Mock,
    expectedStatus: number,
    expectedBody: unknown
  ): void {
    expect(statusMock).toHaveBeenCalledWith(expectedStatus);
    expect(jsonMock).toHaveBeenCalledWith(expectedBody);
  }

  /**
   * Asserts that a middleware returned an error response
   */
  static expectErrorResponse(
    statusMock: jest.Mock,
    jsonMock: jest.Mock,
    expectedStatus: number = HttpStatusCode.SERVICE_UNAVAILABLE,
    expectedError: string
  ): void {
    expect(statusMock).toHaveBeenCalledWith(expectedStatus);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expectedError,
        timestamp: expect.any(String),
      })
    );
  }

  /**
   * Asserts that logger.error was called with specific message and error
   */
  static expectLoggerError(
    mockLogger: jest.Mocked<Pick<typeof logger, 'error'>>,
    message: string,
    error: string
  ): void {
    expect(mockLogger.error).toHaveBeenCalledWith(message, { error });
  }
}

/**
 * Health check specific test utilities
 */
export class HealthTestUtils {
  /**
   * Creates a healthy health check result
   */
  static createHealthyResult(overrides: Partial<IHealthCheckResult> = {}): IHealthCheckResult {
    return TestUtils.createMockHealthResult({
      status: HealthStatus.HEALTHY,
      ...overrides,
    });
  }

  /**
   * Creates an unhealthy health check result
   */
  static createUnhealthyResult(overrides: Partial<IHealthCheckResult> = {}): IHealthCheckResult {
    return TestUtils.createMockHealthResult({
      status: HealthStatus.UNHEALTHY,
      ...overrides,
    });
  }

  /**
   * Creates a degraded health check result
   */
  static createDegradedResult(overrides: Partial<IHealthCheckResult> = {}): IHealthCheckResult {
    return TestUtils.createMockHealthResult({
      status: HealthStatus.DEGRADED,
      ...overrides,
    });
  }

  /**
   * Asserts readiness check success response
   */
  static expectReadinessSuccess(statusMock: jest.Mock, jsonMock: jest.Mock, expectedUptime: number): void {
    TestUtils.expectJsonResponse(statusMock, jsonMock, HttpStatusCode.OK, {
      status: 'ready',
      timestamp: expect.any(String),
      uptime: expectedUptime,
    });
  }

  /**
   * Asserts readiness check failure response
   */
  static expectReadinessFailure(statusMock: jest.Mock, jsonMock: jest.Mock): void {
    TestUtils.expectJsonResponse(statusMock, jsonMock, HttpStatusCode.SERVICE_UNAVAILABLE, {
      status: HealthStatus.UNHEALTHY,
      message: 'Service is not ready',
      timestamp: expect.any(String),
    });
  }

  /**
   * Creates a mock health check function that returns a resolved promise with the given result
   */
  static createMockHealthCheck(result?: {
    status: HealthStatus;
    message: string;
    timestamp: string;
    duration: number;
  }): jest.MockedFunction<
    () => Promise<{ status: HealthStatus; message: string; timestamp: string; duration: number }>
  > {
    const defaultResult = {
      status: HealthStatus.HEALTHY,
      message: 'ok',
      timestamp: '2023-01-01T00:00:00.000Z',
      duration: 0,
    };
    return jest
      .fn<() => Promise<{ status: HealthStatus; message: string; timestamp: string; duration: number }>>()
      .mockResolvedValue(result || defaultResult);
  }
}
