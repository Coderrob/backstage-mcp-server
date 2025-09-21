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

import { HealthCheckFunction, HealthStatus, IHealthCheck, IHealthCheckResult } from '../../shared/types/health.js';
import { errorMetrics } from '../../shared/utils/error-handler.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Service for managing and executing health checks across the application.
 * Implements singleton pattern to ensure consistent health check state.
 */
export class HealthChecker {
  private static instance: HealthChecker;
  private checks: Map<string, HealthCheckFunction> = new Map();
  private startTime: Date;

  private constructor() {
    this.startTime = new Date();
  }

  /**
   * Gets the singleton instance of the health checker.
   * @returns The health checker instance
   */
  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  /**
   * Registers a health check function with the given name.
   * @param name - Unique identifier for the health check
   * @param checkFn - Async function that performs the health check
   */
  registerCheck(name: string, checkFn: HealthCheckFunction): void {
    this.checks.set(name, checkFn);
    logger.info(`Health check registered: ${name}`);
  }

  /**
   * Executes all registered health checks and aggregates the results.
   * @returns Promise resolving to comprehensive health check results
   */
  async runAllChecks(): Promise<IHealthCheckResult> {
    const startTime = Date.now();
    const checks: Record<string, IHealthCheck> = {};
    let overallStatus = HealthStatus.HEALTHY;

    for (const [name, checkFn] of this.checks) {
      const checkResult = await this.executeSingleCheck(name, checkFn, startTime);
      checks[name] = checkResult;

      overallStatus = this.updateOverallStatus(overallStatus, checkResult.status);
    }

    return this.buildHealthResult(overallStatus, checks);
  }

  /**
   * Executes a single health check with error handling.
   * @param name - The name of the health check
   * @param checkFn - The health check function to execute
   * @param _startTime - The overall start time for duration calculation (unused)
   * @returns The health check result
   * @private
   */
  private async executeSingleCheck(
    name: string,
    checkFn: HealthCheckFunction,
    _startTime: number
  ): Promise<IHealthCheck> {
    const checkStart = Date.now();

    try {
      const result = await checkFn();
      const checkEnd = Date.now();

      return {
        ...result,
        timestamp: new Date().toISOString(),
        duration: checkEnd - checkStart,
      };
    } catch (error) {
      logger.error(`Health check failed: ${name}`, {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        status: HealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - checkStart,
      };
    }
  }

  /**
   * Updates the overall health status based on individual check results.
   * @param currentStatus - The current overall status
   * @param checkStatus - The status of the individual check
   * @returns The updated overall status
   * @private
   */
  private updateOverallStatus(currentStatus: HealthStatus, checkStatus: HealthStatus): HealthStatus {
    if (checkStatus === HealthStatus.UNHEALTHY) {
      return HealthStatus.UNHEALTHY;
    }

    if (checkStatus === HealthStatus.DEGRADED && currentStatus === HealthStatus.HEALTHY) {
      return HealthStatus.DEGRADED;
    }

    return currentStatus;
  }

  /**
   * Builds the final health check result object.
   * @param overallStatus - The overall health status
   * @param checks - The individual check results
   * @returns The complete health check result
   * @private
   */
  private buildHealthResult(overallStatus: HealthStatus, checks: Record<string, IHealthCheck>): IHealthCheckResult {
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
      metrics: {
        errors: errorMetrics.getMetrics(),
      },
    };
  }

  /**
   * Gets the server uptime in seconds.
   * @returns Uptime in seconds since service start
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }
}

/**
 * Global health checker instance.
 */
export const healthChecker = HealthChecker.getInstance();
