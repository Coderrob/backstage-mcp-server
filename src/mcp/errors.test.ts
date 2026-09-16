/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import {
  McpAuthenticationError,
  McpAuthorizationError,
  McpConfigurationError,
  McpErrorCode,
  McpHarnessError,
  McpInputError,
  McpLifecycleError,
  McpNotFoundError,
  McpOutputError,
  McpRateLimitError,
  McpTimeoutError,
  McpUpstreamError,
} from './errors.js';

describe('MCP errors', () => {
  it('should retain base error metadata and cause', () => {
    const cause = new Error('cause');
    const error = new McpHarnessError(McpErrorCode.CONFLICT, 'conflict', { id: 'one' }, { cause });
    expect(error).toMatchObject({
      name: 'McpHarnessError',
      code: McpErrorCode.CONFLICT,
      details: { id: 'one' },
      cause,
    });
  });

  it('should construct every specialized error with its stable code', () => {
    const cases = [
      new McpInputError('bad input', { field: 'name' }),
      new McpOutputError({ cause: new Error('schema') }),
      new McpAuthenticationError(),
      new McpAuthorizationError(['catalog:read']),
      new McpNotFoundError('Entity'),
      new McpNotFoundError('Entity', 'component:default/api'),
      new McpRateLimitError(500),
      new McpTimeoutError(1000),
      new McpUpstreamError('upstream', { cause: new Error('network') }),
      new McpConfigurationError('configuration', { key: 'name' }),
      new McpLifecycleError('lifecycle'),
    ];
    expect(cases.map(({ code }) => code)).toEqual([
      McpErrorCode.INVALID_INPUT,
      McpErrorCode.INTERNAL_ERROR,
      McpErrorCode.AUTHENTICATION_REQUIRED,
      McpErrorCode.INSUFFICIENT_PERMISSIONS,
      McpErrorCode.NOT_FOUND,
      McpErrorCode.NOT_FOUND,
      McpErrorCode.RATE_LIMITED,
      McpErrorCode.TIMEOUT,
      McpErrorCode.UPSTREAM_ERROR,
      McpErrorCode.INVALID_CONFIGURATION,
      McpErrorCode.INVALID_LIFECYCLE,
    ]);
  });
});
