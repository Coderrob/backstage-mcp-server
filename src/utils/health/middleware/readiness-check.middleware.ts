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
