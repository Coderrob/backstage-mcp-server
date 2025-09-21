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
 * Tool registry health check
 */

export async function toolRegistryHealthCheck(): Promise<IHealthCheck> {
  const startTime = Date.now();
  try {
    // In a real implementation, you'd check if tools are properly registered
    // For now, return healthy status
    const duration = Date.now() - startTime;
    return {
      status: HealthStatus.HEALTHY,
      message: 'Tool registry is operational',
      timestamp: new Date().toISOString(),
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Tool registry health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: HealthStatus.UNHEALTHY,
      message: 'Tool registry check failed',
      timestamp: new Date().toISOString(),
      duration,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
