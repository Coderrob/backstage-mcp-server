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
import { Request, Response } from 'express';

import { errorMetrics } from '../../../shared/utils/error-handler.js';
import { healthChecker } from '../health-checker.js';

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
