import { Request, Response } from 'express';

import { HttpStatusCode } from '../../../types/constants.js';
import { HealthStatus } from '../../../types/health.js';
import { logger } from '../../core/logger.js';
import { healthChecker } from '../health-checks.js';

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
 * @param req - Express request object
 * @param res - Express response object
 */
export async function healthCheckMiddleware(_req: Request, res: Response): Promise<void> {
  try {
    const result = await healthChecker.runAllChecks();
    const statusCode = getStatusCodeForHealth(result.status);

    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
      status: HealthStatus.UNHEALTHY,
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
    });
  }
}
