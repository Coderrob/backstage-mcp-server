import { Request, Response } from 'express';

import { errorMetrics } from '../../errors/error-handler.js';
import { healthChecker } from '../health-checks.js';

/**
 * Express middleware for /metrics endpoint providing Prometheus-style metrics.
 * Outputs metrics in Prometheus exposition format for monitoring systems.
 * @param _req - Express request object
 * @param res - Express response object
 */
export function metricsMiddleware(_req: Request, res: Response): void {
  const metrics = errorMetrics.getMetrics();
  const uptime = healthChecker.getUptime();

  let output = '# MCP Server Metrics\n';

  for (const [errorType, count] of Object.entries(metrics)) {
    output += `# HELP mcp_errors_total Total number of errors by type\n`;
    output += `# TYPE mcp_errors_total counter\n`;
    output += `mcp_errors_total{type="${errorType}"} ${count}\n`;
  }

  output += `# HELP mcp_uptime_seconds Server uptime in seconds\n`;
  output += `# TYPE mcp_uptime_seconds gauge\n`;
  output += `mcp_uptime_seconds ${uptime}\n`;

  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(output);
}
