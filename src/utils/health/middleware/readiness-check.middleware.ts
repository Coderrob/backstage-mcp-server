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

import { HttpStatusCode } from '../../../types/constants.js';
import { HealthStatus } from '../../../types/health.js';
import { logger } from '../../../utils/core/logger.js';
import { healthChecker } from '../health-checks.js';

/**
 * Express middleware for /ready endpoint providing simple readiness check.
 * Returns basic readiness status for load balancer health checks.
 * @param _req - Express request object
 * @param res - Express response object
 */
export async function readinessCheckMiddleware(_req: Request, res: Response): Promise<void> {
  try {
    const result = await healthChecker.runAllChecks();

    if (result.status === HealthStatus.UNHEALTHY) {
      res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
        status: HealthStatus.UNHEALTHY,
        message: 'Service is not ready',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(HttpStatusCode.OK).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: result.uptime,
    });
  } catch (error) {
    logger.error('Readiness check failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
      status: HealthStatus.UNHEALTHY,
      message: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    });
  }
}
