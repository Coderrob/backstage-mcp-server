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
export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, HealthCheck>;
  metrics?: {
    errors: Record<string, number>;
    totalRequests?: number;
    activeConnections?: number;
  };
}

/**
 * Individual health check result.
 */
export interface HealthCheck {
  status: HealthStatus;
  message?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  duration: number;
}

/**
 * Function signature for health check implementations.
 */
export type HealthCheckFunction = () => Promise<HealthCheck>;
