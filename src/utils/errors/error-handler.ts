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
import { NextFunction, Request, Response } from 'express';

import { logger } from '../core/logger.js';
import { InternalServerError, MCPError } from './custom-errors.js';

/**
 * Error metrics collector for observability
 */
export class ErrorMetrics {
  private static instance: ErrorMetrics;
  private metrics: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ErrorMetrics {
    if (!ErrorMetrics.instance) {
      ErrorMetrics.instance = new ErrorMetrics();
    }
    return ErrorMetrics.instance;
  }

  /**
   * Records an error occurrence
   */
  recordError(error: MCPError | Error): void {
    const errorType = error instanceof MCPError ? error.code : 'UNKNOWN_ERROR';
    const currentCount = this.metrics.get(errorType) || 0;
    this.metrics.set(errorType, currentCount + 1);

    logger.debug('Error recorded in metrics', {
      errorType,
      totalCount: currentCount + 1,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Gets current error metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Resets all metrics (useful for testing)
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Gets error rate for a specific error type
   */
  getErrorRate(errorType: string, _timeWindowMs: number = 60000): number {
    // In a real implementation, you'd track timestamps and calculate rates
    // For now, return the total count
    return this.metrics.get(errorType) || 0;
  }
}

/**
 * Global error metrics instance
 */
export const errorMetrics = ErrorMetrics.getInstance();

/**
 * Express error handling middleware
 */
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  // Record error in metrics
  errorMetrics.recordError(error);

  // Determine if it's an MCP error or generic error
  const isMCPError = error instanceof MCPError;

  const mcpError = isMCPError
    ? error
    : new InternalServerError(error.message, {
        originalStack: error.stack,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });

  // Log the error with structured data
  logger.error('Request error handled', {
    error: mcpError.toLogObject(),
    request: {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.get('User-Agent'),
        'content-type': req.get('Content-Type'),
        'x-forwarded-for': req.get('X-Forwarded-For'),
      },
      ip: req.ip,
      query: req.query,
      body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined,
    },
  });

  // Send appropriate response
  res.status(mcpError.statusCode).json({
    jsonrpc: '2.0',
    error: {
      code: mcpError.statusCode,
      message: mcpError.message,
      data: mcpError.toClientObject(),
    },
    id: null, // Error responses don't have an ID in JSON-RPC 2.0
  });
}

/**
 * Sanitizes request body for logging (removes sensitive data)
 */
export function sanitizeRequestBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body } as Record<string, unknown>;

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'api_key',
    'access_token',
    'refresh_token',
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Async error wrapper for route handlers
 */
export function asyncErrorHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

/**
 * Wraps a function with error handling and metrics
 */
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Record error in metrics
    errorMetrics.recordError(error as Error);

    // Log with context
    logger.error(`Operation failed: ${operation}`, {
      error:
        error instanceof MCPError
          ? error.toLogObject()
          : {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
      context,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}
