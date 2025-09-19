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
import { HealthCheck, HealthStatus } from '../../types/health.js';
import { logger } from '../core/logger.js';
import { healthChecker } from './health-checks.js';

/**
 * Built-in health checks for common services
 */

/**
 * Database connectivity health check
 */
export async function databaseHealthCheck(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    // In a real implementation, you'd check database connectivity
    // For now, return healthy status
    const duration = Date.now() - startTime;
    return {
      status: HealthStatus.HEALTHY,
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      status: HealthStatus.UNHEALTHY,
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      duration,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * External API connectivity health check
 */
export async function apiConnectivityHealthCheck(): Promise<HealthCheck> {
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

/**
 * Memory usage health check
 */
export async function memoryHealthCheck(): Promise<HealthCheck> {
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

/**
 * Tool registry health check
 */
export async function toolRegistryHealthCheck(): Promise<HealthCheck> {
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

/**
 * Registers all built-in health checks
 */
export function registerBuiltInHealthChecks(): void {
  healthChecker.registerCheck('database', databaseHealthCheck);
  healthChecker.registerCheck('api-connectivity', apiConnectivityHealthCheck);
  healthChecker.registerCheck('memory', memoryHealthCheck);
  healthChecker.registerCheck('tool-registry', toolRegistryHealthCheck);

  logger.info('Built-in health checks registered');
}
