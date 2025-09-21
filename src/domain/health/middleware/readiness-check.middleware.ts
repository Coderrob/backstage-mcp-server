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
 * Express middleware for /ready endpoint providing simple readiness check.
 * Returns basic readiness status for load balancer health checks.
 */
export class ReadinessCheckMiddleware extends BaseHealthMiddleware {
  protected getErrorLogName(): string {
    return 'Readiness check';
  }

  protected formatResponse(result: IHealthCheckResult): {
    statusCode: number;
    body: unknown;
  } {
    if (result.status === HealthStatus.UNHEALTHY) {
      return {
        statusCode: HttpStatusCode.SERVICE_UNAVAILABLE,
        body: {
          status: HealthStatus.UNHEALTHY,
          message: 'Service is not ready',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      statusCode: HttpStatusCode.OK,
      body: {
        status: 'ready',
        timestamp: new Date().toISOString(),
        uptime: result.uptime,
      },
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
        message: 'Readiness check failed',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Export the middleware function for backward compatibility
const readinessCheckMiddlewareInstance = new ReadinessCheckMiddleware();
export const readinessCheckMiddleware = readinessCheckMiddlewareInstance.createMiddleware();
