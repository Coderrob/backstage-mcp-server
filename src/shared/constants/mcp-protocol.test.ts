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

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MCP_CACHE_CAPACITY,
  DEFAULT_MCP_RATE_LIMIT_CAPACITY,
  McpApplicationState,
  McpContentType,
  McpFeatureKind,
  McpJsonSchemaReferenceStrategy,
  McpTransportName,
} from './mcp-protocol.js';

describe('MCP protocol constants', () => {
  it('should expose stable protocol and lifecycle values', () => {
    expect(Object.values(McpApplicationState)).toEqual(['created', 'starting', 'running', 'stopping', 'stopped']);
    expect(McpContentType.TEXT).toBe('text');
    expect(Object.values(McpFeatureKind)).toEqual(['tool', 'resource', 'resource-template', 'prompt']);
    expect(McpJsonSchemaReferenceStrategy.INLINE).toBe('none');
    expect(Object.values(McpTransportName)).toEqual(['stdio', 'in-memory']);
    expect(DEFAULT_MCP_CACHE_CAPACITY).toBe(1000);
    expect(DEFAULT_MCP_RATE_LIMIT_CAPACITY).toBe(10_000);
  });
});
