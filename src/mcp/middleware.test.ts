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

describe('MCP middleware', () => {
  it('should compose middleware in declaration order', async () => {
    const events: string[] = [];
    const result = await composeMiddleware(
      [
        async <TResult>(
          _value: McpMiddlewareInvocation<object>,
          next: () => Promise<TResult>
        ): Promise<TResult> => {
          events.push('outer-before');
          const nested = await next();
          events.push('outer-after');
          return nested;
        },
        async <TResult>(
          _value: McpMiddlewareInvocation<object>,
          next: () => Promise<TResult>
        ): Promise<TResult> => {
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
    const info = vi.fn();
    const error = vi.fn();
    const logger: Logger = { debug: vi.fn(), info, warn: vi.fn(), error };
    const middleware = requestLogging(logger);
    await expect(middleware(invocation, async () => 'done')).resolves.toBe('done');
    const failure = new Error('failed');
    await expect(
      middleware({ ...invocation, request: { ...invocation.request, principal: undefined } }, async () => {
        throw failure;
      })
    ).rejects.toBe(failure);
    expect(info).toHaveBeenCalledTimes(3);
    expect(error).toHaveBeenCalledWith(
      'MCP invocation failed',
      expect.objectContaining({ requestId: 'request-one', error: 'failed' })
    );
  });

  it('should log non-Error failures without exposing a stack', async () => {
    const error = vi.fn();
    const logger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error };
    const failure = Promise.withResolvers<never>();
    failure.reject('failure');
    await expect(requestLogging(logger)(invocation, async () => failure.promise)).rejects.toBe('failure');
    expect(error).toHaveBeenCalledWith('MCP invocation failed', expect.objectContaining({ error: 'failure' }));
  });
});
