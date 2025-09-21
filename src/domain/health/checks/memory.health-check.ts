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

import { HealthStatus, IHealthCheck } from '../../../shared/types/health.js';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Memory usage health check
 */

export async function memoryHealthCheck(): Promise<IHealthCheck> {
  const startTime = Date.now();
  try {
    const memUsage = process.memoryUsage();
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const usagePercent = Math.round((usedMB / totalMB) * 100);

    // Consider unhealthy if memory usage > 90%
    const status =
      usagePercent > 95 ? HealthStatus.UNHEALTHY : usagePercent > 90 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;

    const duration = Date.now() - startTime;
    return {
      status,
      message: `Memory usage: ${usedMB}MB/${totalMB}MB (${usagePercent}%)`,
      timestamp: new Date().toISOString(),
      duration,
      details: {
        heapUsed: usedMB,
        heapTotal: totalMB,
        usagePercent,
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Memory health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: HealthStatus.UNHEALTHY,
      message: 'Memory check failed',
      timestamp: new Date().toISOString(),
      duration,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
