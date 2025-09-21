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

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IToolExecutionArgs, IToolExecutionContext, IToolMiddleware } from '../types.js';

/**
 * Logging middleware for audit and debugging
 * Implements logging cross-cutting concern
 */

export class LoggingMiddleware implements IToolMiddleware {
  name = 'logging';
  priority = 5; // Run early to capture all requests

  async execute(
    params: IToolExecutionArgs,
    context: IToolExecutionContext,
    next: (params: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Tool execution started - using warn for compatibility with linting rules
    console.warn(`[${requestId}] Tool execution started`, {
      userId: context.userId,
      timestamp: new Date().toISOString(),
      params: this.sanitizeParams(params),
    });

    try {
      const result = await next(params, context);
      const duration = Date.now() - startTime;

      // Tool execution completed - using warn for compatibility with linting rules
      console.warn(`[${requestId}] Tool execution completed`, {
        duration: `${duration}ms`,
        status: 'success',
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`[${requestId}] Tool execution failed`, {
        duration: `${duration}ms`,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private sanitizeParams(params: IToolExecutionArgs): unknown {
    // Remove sensitive data from logs
    const sanitized = { ...params };
    const sensitiveKeys = ['password', 'token', 'secret', 'key'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
