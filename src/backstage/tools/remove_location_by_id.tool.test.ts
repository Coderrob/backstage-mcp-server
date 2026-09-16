/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { removeLocationByIdTool } from './remove_location_by_id.tool.js';

describe('remove_location_by_id tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(removeLocationByIdTool).toMatchObject({ kind: 'tool', name: 'remove_location_by_id' });
    expect(removeLocationByIdTool.inputSchema.safeParse({ locationId: 'location-1' }).success).toBe(true);
    expect(removeLocationByIdTool.description.length).toBeGreaterThan(0);
  });
});
