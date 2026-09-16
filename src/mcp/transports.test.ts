/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';

import { McpTransportName } from '../shared/constants/mcp-protocol.js';
import { defineTransport, stdioTransport } from './transports.js';

describe('MCP transports', () => {
  it('should create immutable named transport factories', () => {
    const [, serverTransport] = InMemoryTransport.createLinkedPair();
    const factory = defineTransport('memory', () => serverTransport);
    expect(factory.name).toBe('memory');
    expect(factory.create()).toBe(serverTransport);
    expect(Object.isFrozen(factory)).toBe(true);
  });

  it('should create fresh stdio transports', () => {
    const factory = stdioTransport();
    expect(factory.name).toBe(McpTransportName.STDIO);
    expect(factory.create()).not.toBe(factory.create());
  });
});
