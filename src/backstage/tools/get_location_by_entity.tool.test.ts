/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { getLocationByEntityTool } from './get_location_by_entity.tool.js';

describe('get_location_by_entity tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getLocationByEntityTool).toMatchObject({ kind: 'tool', name: 'get_location_by_entity' });
    expect(getLocationByEntityTool.inputSchema.safeParse({ entityRef: 'component:default/api' }).success).toBe(true);
    expect(getLocationByEntityTool.description.length).toBeGreaterThan(0);
  });
});
