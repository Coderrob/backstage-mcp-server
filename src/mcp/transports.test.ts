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
