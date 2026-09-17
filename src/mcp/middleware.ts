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

import type { Logger } from '../types/logging.js';
import type { McpMiddleware, McpMiddlewareInvocation } from '../types/mcp.js';

export type { McpMiddleware, McpMiddlewareInvocation } from '../types/mcp.js';

/**
 * Composes middleware in declaration order around a terminal feature handler.
 * @param middleware - Ordered middleware collection.
 * @param invocation - Invocation shared by every middleware function.
 * @param handler - Terminal feature handler.
 * @returns The value produced by middleware or the terminal handler.
 */
export function composeMiddleware<TContext, TResult>(
  middleware: readonly McpMiddleware<TContext>[],
  invocation: Readonly<McpMiddlewareInvocation<TContext>>,
  handler: () => Promise<TResult>
): Promise<TResult> {
  let next = handler;
  for (let index = middleware.length - 1; index >= 0; index -= 1) {
    const current = middleware[index];
    const downstream = next;
    next = /** Performs the next operation for the callback. */ (): Promise<TResult> => current(invocation, downstream);
  }
  return next();
}

/**
 * Logs one invocation around its downstream handler.
 * @param logger - Logger used for lifecycle events.
 * @param invocation - Active middleware invocation.
 * @param next - Downstream middleware or feature handler.
 * @returns The unchanged downstream result.
 * @throws {unknown} The unchanged downstream failure.
 */
async function logInvocation<TContext, TResult>(
  logger: Readonly<Logger>,
  invocation: Readonly<McpMiddlewareInvocation<TContext>>,
  next: () => Promise<TResult>
): Promise<TResult> {
  const fields = {
    requestId: invocation.request.id,
    plugin: invocation.request.plugin,
    feature: invocation.request.feature,
    kind: invocation.kind,
    principalId: invocation.request.principal?.id,
  };
  logger.info('MCP invocation started', fields);
  try {
    const result = await next();
    logger.info('MCP invocation completed', {
      ...fields,
      durationMs: Date.now() - invocation.request.startedAt.getTime(),
    });
    return result;
  } catch (error) {
    logger.error('MCP invocation failed', {
      ...fields,
      durationMs: Date.now() - invocation.request.startedAt.getTime(),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Creates middleware that logs request identity, duration, and safe failures.
 * @param logger - Logger used for lifecycle events.
 * @returns Request-logging middleware.
 */
export function requestLogging<TContext>(logger: Readonly<Logger>): McpMiddleware<TContext> {
  return /** Logs the invocation lifecycle around the downstream handler. */ <TResult>(
    invocation: Readonly<McpMiddlewareInvocation<TContext>>,
    next: () => Promise<TResult>
  ): Promise<TResult> => logInvocation(logger, invocation, next);
}
