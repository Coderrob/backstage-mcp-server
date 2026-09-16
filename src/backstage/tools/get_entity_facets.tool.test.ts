/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { getEntityFacetsTool } from './get_entity_facets.tool.js';

describe('get_entity_facets tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getEntityFacetsTool).toMatchObject({ kind: 'tool', name: 'get_entity_facets' });
    expect(getEntityFacetsTool.inputSchema.safeParse({ facets: ['kind'] }).success).toBe(true);
    expect(getEntityFacetsTool.description.length).toBeGreaterThan(0);
  });
});
