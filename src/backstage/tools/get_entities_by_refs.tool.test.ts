/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { getEntitiesByRefsTool } from './get_entities_by_refs.tool.js';

describe('get_entities_by_refs tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getEntitiesByRefsTool).toMatchObject({ kind: 'tool', name: 'get_entities_by_refs' });
    expect(getEntitiesByRefsTool.inputSchema.safeParse({ entityRefs: ['component:default/api'] }).success).toBe(true);
    expect(getEntitiesByRefsTool.description.length).toBeGreaterThan(0);
  });
});
