/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { getLocationByRefTool } from './get_location_by_ref.tool.js';

describe('get_location_by_ref tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getLocationByRefTool).toMatchObject({ kind: 'tool', name: 'get_location_by_ref' });
    expect(
      getLocationByRefTool.inputSchema.safeParse({ locationRef: 'url:https://example.test/catalog-info.yaml' }).success
    ).toBe(true);
    expect(getLocationByRefTool.description.length).toBeGreaterThan(0);
  });
});
