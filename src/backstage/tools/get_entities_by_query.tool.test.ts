/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { getEntitiesByQueryTool } from './get_entities_by_query.tool.js';

describe('get_entities_by_query tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getEntitiesByQueryTool).toMatchObject({ kind: 'tool', name: 'get_entities_by_query' });
    expect(getEntitiesByQueryTool.inputSchema.safeParse({ order: { field: 'metadata.name' } }).success).toBe(true);
    expect(getEntitiesByQueryTool.description.length).toBeGreaterThan(0);
  });
});
