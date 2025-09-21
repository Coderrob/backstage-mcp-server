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
 * External API connectivity health check
 */

export async function apiConnectivityHealthCheck(): Promise<IHealthCheck> {
  const startTime = Date.now();
  try {
    // Check if BACKSTAGE_BASE_URL is configured
    const baseUrl = process.env.BACKSTAGE_BASE_URL;
    if (!baseUrl) {
      const duration = Date.now() - startTime;
      return {
        status: HealthStatus.UNHEALTHY,
        message: 'BACKSTAGE_BASE_URL environment variable not set',
        timestamp: new Date().toISOString(),
        duration,
      };
    }

    // In a real implementation, you'd make a test request to the API
    // For now, just check if the URL is valid
    try {
      new URL(baseUrl);
      const duration = Date.now() - startTime;
      return {
        status: HealthStatus.HEALTHY,
        message: 'API configuration is valid',
        timestamp: new Date().toISOString(),
        duration,
        details: {
          baseUrl,
        },
      };
    } catch {
      const duration = Date.now() - startTime;
      return {
        status: HealthStatus.UNHEALTHY,
        message: 'BACKSTAGE_BASE_URL is not a valid URL',
        timestamp: new Date().toISOString(),
        duration,
        details: {
          baseUrl,
        },
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('API connectivity health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: HealthStatus.UNHEALTHY,
      message: 'API connectivity check failed',
      timestamp: new Date().toISOString(),
      duration,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
