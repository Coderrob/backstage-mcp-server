/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { getEntityAncestorsTool } from './get_entity_ancestors.tool.js';

describe('get_entity_ancestors tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getEntityAncestorsTool).toMatchObject({ kind: 'tool', name: 'get_entity_ancestors' });
    expect(getEntityAncestorsTool.inputSchema.safeParse({ entityRef: 'component:default/api' }).success).toBe(true);
    expect(getEntityAncestorsTool.description.length).toBeGreaterThan(0);
  });
});
