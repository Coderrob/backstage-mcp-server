/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
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
export function composeMiddleware<TContext>(
  middleware: readonly McpMiddleware<TContext>[],
  invocation: Readonly<McpMiddlewareInvocation<TContext>>,
  handler: () => Promise<unknown>
): Promise<unknown> {
  let next = handler;
  for (let index = middleware.length - 1; index >= 0; index -= 1) {
    const current = middleware[index];
    const downstream = next;
    next = /** Performs the next operation for the callback. */ (): Promise<unknown> => current(invocation, downstream);
  }
  return next();
}

/**
 * Creates middleware that logs request identity, duration, and safe failures.
 * @param logger - Logger used for lifecycle events.
 * @returns Request-logging middleware.
 */
export function requestLogging<TContext>(logger: Readonly<Logger>): McpMiddleware<TContext> {
  return /** Logs the invocation lifecycle around the downstream handler. */ async (
    invocation,
    next
  ): Promise<unknown> => {
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
  };
}
