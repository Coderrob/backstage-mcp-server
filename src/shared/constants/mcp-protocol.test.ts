/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { McpApplicationState, McpContentType, McpFeatureKind, McpTransportName } from './mcp-protocol.js';

describe('MCP protocol constants', () => {
  it('should expose stable protocol and lifecycle values', () => {
    expect(Object.values(McpApplicationState)).toEqual(['created', 'starting', 'running', 'stopping', 'stopped']);
    expect(McpContentType.TEXT).toBe('text');
    expect(Object.values(McpFeatureKind)).toEqual(['tool', 'resource', 'resource-template', 'prompt']);
    expect(Object.values(McpTransportName)).toEqual(['stdio', 'in-memory']);
  });
});
