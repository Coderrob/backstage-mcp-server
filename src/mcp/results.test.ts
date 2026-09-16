/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { McpErrorCode, McpNotFoundError } from './errors.js';
import { errorResult, jsonResult, mapToolError, textResult } from './results.js';

describe('MCP results', () => {
  it('should create text, structured JSON, and optional-detail error results', () => {
    expect(textResult('ready')).toEqual({ content: [{ type: 'text', text: 'ready' }] });
    expect(jsonResult({ count: 2n })).toMatchObject({ structuredContent: { count: 2n } });
    expect(jsonResult({ count: 2n }).content[0]).toMatchObject({ text: expect.stringContaining('"2"') });
    expect(errorResult(McpErrorCode.CONFLICT, 'exists')).not.toHaveProperty('structuredContent.error.details');
  });

  it('should map known and unexpected failures safely', () => {
    expect(mapToolError(new McpNotFoundError('Entity', 'missing'), 'request-one')).toMatchObject({
      isError: true,
      structuredContent: { error: { code: McpErrorCode.NOT_FOUND, details: { reference: 'missing' } } },
    });
    expect(mapToolError(new Error('private'), 'request-two')).toMatchObject({
      isError: true,
      structuredContent: { error: { code: McpErrorCode.INTERNAL_ERROR, details: { requestId: 'request-two' } } },
    });
  });
});
