/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it, vi } from 'vitest';

import { McpFeatureKind } from '../shared/constants/mcp-protocol.js';
import type { Logger } from '../shared/logging/logger.js';
import type { McpMiddlewareInvocation } from './middleware.js';
import { composeMiddleware, requestLogging } from './middleware.js';

const invocation: McpMiddlewareInvocation<object> = {
  input: {},
  context: {},
  kind: McpFeatureKind.TOOL,
  request: {
    id: 'request-one',
    feature: 'read_value',
    plugin: 'test-plugin',
    transport: 'memory',
    signal: new AbortController().signal,
    startedAt: new Date(0),
    principal: { id: 'caller', scopes: [] },
  },
};

/** Creates a logger whose methods can be asserted. */
function createLogger(): Logger {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe('MCP middleware', () => {
  it('should compose middleware in declaration order', async () => {
    const events: string[] = [];
    const result = await composeMiddleware(
      [
        async (_value, next): Promise<unknown> => {
          events.push('outer-before');
          const nested = await next();
          events.push('outer-after');
          return nested;
        },
        async (_value, next): Promise<unknown> => {
          events.push('inner-before');
          return next();
        },
      ],
      invocation,
      async () => 'complete'
    );
    expect(result).toBe('complete');
    expect(events).toEqual(['outer-before', 'inner-before', 'outer-after']);
  });

  it('should log successful and failed request lifecycles', async () => {
    const logger = createLogger();
    const middleware = requestLogging(logger);
    await expect(middleware(invocation, async () => 'done')).resolves.toBe('done');
    const failure = new Error('failed');
    await expect(
      middleware({ ...invocation, request: { ...invocation.request, principal: undefined } }, async () => {
        throw failure;
      })
    ).rejects.toBe(failure);
    expect(logger.info).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledWith(
      'MCP invocation failed',
      expect.objectContaining({ requestId: 'request-one', error: 'failed' })
    );
  });

  it('should log non-Error failures without exposing a stack', async () => {
    const logger = createLogger();
    await expect(requestLogging(logger)(invocation, async () => Promise.reject('failure'))).rejects.toBe('failure');
    expect(logger.error).toHaveBeenCalledWith('MCP invocation failed', expect.objectContaining({ error: 'failure' }));
  });
});
