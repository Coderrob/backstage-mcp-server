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

/**
 * Health status enumeration for service health checks.
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}

/**
 * Result of running health checks across the service.
 */
export interface IHealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, IHealthCheck>;
  metrics?: {
    errors: Record<string, number>;
    totalRequests?: number;
    activeConnections?: number;
  };
}

/**
 * Individual health check result.
 */
export interface IHealthCheck {
  status: HealthStatus;
  message?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  duration: number;
}

/**
 * Function signature for health check implementations.
 */
export type HealthCheckFunction = () => Promise<IHealthCheck>;
