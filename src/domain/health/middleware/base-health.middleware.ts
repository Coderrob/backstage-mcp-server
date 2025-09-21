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
import { Request, Response } from 'express';

import { IHealthCheckResult } from '../../../shared/types/health.js';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Abstract base class for health check middlewares.
 * Provides common functionality for running health checks and error handling.
 */
export abstract class BaseHealthMiddleware {
  /**
   * Gets the name to use in error log messages.
   * @returns The name for error logging
   */
  protected abstract getErrorLogName(): string;

  /**
   * Formats the health check result into the appropriate response format.
   * @param result - The health check result
   * @returns Object containing status code and response body
   */
  protected abstract formatResponse(result: IHealthCheckResult): {
    statusCode: number;
    body: unknown;
  };

  /**
   * Handles errors that occur during health check execution.
   * @param error - The error that occurred
   * @returns Object containing status code and error response body
   */
  protected abstract formatErrorResponse(error: unknown): {
    statusCode: number;
    body: unknown;
  };

  /**
   * Creates an Express middleware function for health checks.
   * @returns Express middleware function
   */
  public createMiddleware() {
    return async (req: Request, res: Response): Promise<void> => {
      try {
        const { healthChecker } = await import('../health-checker.js');
        const result = await healthChecker.runAllChecks();
        const { statusCode, body } = this.formatResponse(result);

        res.status(statusCode).json(body);
      } catch (error) {
        logger.error(`${this.getErrorLogName()} failed`, {
          error: error instanceof Error ? error.message : String(error),
        });

        const { statusCode, body } = this.formatErrorResponse(error);
        res.status(statusCode).json(body);
      }
    };
  }
}
