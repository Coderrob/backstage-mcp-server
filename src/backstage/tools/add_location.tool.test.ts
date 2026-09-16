/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { addLocationTool } from './add_location.tool.js';

describe('add_location tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(addLocationTool).toMatchObject({ kind: 'tool', name: 'add_location' });
    expect(addLocationTool.inputSchema.safeParse({ target: 'https://example.test/catalog-info.yaml' }).success).toBe(
      true
    );
    expect(addLocationTool.description.length).toBeGreaterThan(0);
  });
});
