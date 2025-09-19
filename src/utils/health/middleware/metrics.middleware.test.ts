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
import { Request, Response } from 'express';

import { errorMetrics } from '../../errors/error-handler.js';
import { healthChecker } from '../health-checks.js';
import { metricsMiddleware } from './metrics.middleware';

// Mock the dependencies
jest.spyOn(errorMetrics, 'getMetrics');
jest.spyOn(healthChecker, 'getUptime');

describe('metricsMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: {
    set: jest.MockedFunction<(header: string, value: string) => void>;
    send: jest.MockedFunction<(body: string) => void>;
  };
  let setHeaderSpy: unknown;
  let sendSpy: unknown;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      set: jest.fn(),
      send: jest.fn(),
    };
    setHeaderSpy = jest.spyOn(mockRes, 'set');
    sendSpy = jest.spyOn(mockRes, 'send');
    jest.clearAllMocks();
  });

  it('should generate metrics output with no errors and uptime', () => {
    (errorMetrics.getMetrics as jest.MockedFunction<typeof errorMetrics.getMetrics>).mockReturnValue({});
    (healthChecker.getUptime as jest.MockedFunction<typeof healthChecker.getUptime>).mockReturnValue(123.45);

    metricsMiddleware(mockReq as Request, mockRes as unknown as Response);

    expect(errorMetrics.getMetrics).toHaveBeenCalledTimes(1);
    expect(healthChecker.getUptime).toHaveBeenCalledTimes(1);
    expect(setHeaderSpy).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    expect(sendSpy).toHaveBeenCalledWith(
      '# MCP Server Metrics\n' +
        '# HELP mcp_uptime_seconds Server uptime in seconds\n' +
        '# TYPE mcp_uptime_seconds gauge\n' +
        'mcp_uptime_seconds 123.45\n'
    );
  });

  it('should generate metrics output with errors and uptime', () => {
    (errorMetrics.getMetrics as jest.MockedFunction<typeof errorMetrics.getMetrics>).mockReturnValue({
      TypeError: 5,
      ReferenceError: 2,
    });
    (healthChecker.getUptime as jest.MockedFunction<typeof healthChecker.getUptime>).mockReturnValue(678.9);

    metricsMiddleware(mockReq as Request, mockRes as unknown as Response);

    expect(errorMetrics.getMetrics).toHaveBeenCalledTimes(1);
    expect(healthChecker.getUptime).toHaveBeenCalledTimes(1);
    expect(setHeaderSpy).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    expect(sendSpy).toHaveBeenCalledWith(
      '# MCP Server Metrics\n' +
        '# HELP mcp_errors_total Total number of errors by type\n' +
        '# TYPE mcp_errors_total counter\n' +
        'mcp_errors_total{type="TypeError"} 5\n' +
        '# HELP mcp_errors_total Total number of errors by type\n' +
        '# TYPE mcp_errors_total counter\n' +
        'mcp_errors_total{type="ReferenceError"} 2\n' +
        '# HELP mcp_uptime_seconds Server uptime in seconds\n' +
        '# TYPE mcp_uptime_seconds gauge\n' +
        'mcp_uptime_seconds 678.9\n'
    );
  });

  it('should handle zero uptime', () => {
    (errorMetrics.getMetrics as jest.MockedFunction<typeof errorMetrics.getMetrics>).mockReturnValue({});
    (healthChecker.getUptime as jest.MockedFunction<typeof healthChecker.getUptime>).mockReturnValue(0);

    metricsMiddleware(mockReq as Request, mockRes as unknown as Response);

    expect(sendSpy).toHaveBeenCalledWith(
      '# MCP Server Metrics\n' +
        '# HELP mcp_uptime_seconds Server uptime in seconds\n' +
        '# TYPE mcp_uptime_seconds gauge\n' +
        'mcp_uptime_seconds 0\n'
    );
  });
});
