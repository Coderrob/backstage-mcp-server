/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { getEntityByRefTool } from './get_entity_by_ref.tool.js';

describe('get_entity_by_ref tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getEntityByRefTool).toMatchObject({ kind: 'tool', name: 'get_entity_by_ref' });
    expect(getEntityByRefTool.inputSchema.safeParse({ entityRef: 'component:default/api' }).success).toBe(true);
    expect(getEntityByRefTool.description.length).toBeGreaterThan(0);
  });
});
