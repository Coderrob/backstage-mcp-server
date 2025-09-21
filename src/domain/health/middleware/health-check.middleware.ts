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

import { HttpStatusCode } from '../../../shared/types/constants.js';
import { HealthStatus, IHealthCheckResult } from '../../../shared/types/health.js';
import { BaseHealthMiddleware } from './base-health.middleware.js';

/**
 * Determines the appropriate HTTP status code for a health status.
 * @param status - The health status
 * @returns The corresponding HTTP status code
 */
export function getStatusCodeForHealth(status: HealthStatus): number {
  switch (status) {
    case HealthStatus.HEALTHY:
      return HttpStatusCode.OK;
    case HealthStatus.DEGRADED:
      return HttpStatusCode.OK;
    case HealthStatus.UNHEALTHY:
    default:
      return HttpStatusCode.SERVICE_UNAVAILABLE;
  }
}

/**
 * Express middleware for /health endpoint providing detailed health check results.
 * Returns comprehensive health status including individual check results and metrics.
 */
export class HealthCheckMiddleware extends BaseHealthMiddleware {
  protected getErrorLogName(): string {
    return 'Health check';
  }

  protected formatResponse(result: IHealthCheckResult): {
    statusCode: number;
    body: unknown;
  } {
    const statusCode = getStatusCodeForHealth(result.status);
    return {
      statusCode,
      body: result,
    };
  }

  protected formatErrorResponse(_error: unknown): {
    statusCode: number;
    body: unknown;
  } {
    return {
      statusCode: HttpStatusCode.SERVICE_UNAVAILABLE,
      body: {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date().toISOString(),
        error: 'Health check system failure',
      },
    };
  }
}

// Export the middleware function for backward compatibility
const healthCheckMiddlewareInstance = new HealthCheckMiddleware();
export const healthCheckMiddleware = healthCheckMiddlewareInstance.createMiddleware();
