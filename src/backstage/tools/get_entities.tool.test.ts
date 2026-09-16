/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { getEntitiesTool } from './get_entities.tool.js';

describe('get_entities tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getEntitiesTool).toMatchObject({ kind: 'tool', name: 'get_entities' });
    expect(getEntitiesTool.inputSchema.safeParse({ filter: { kind: 'Component' } }).success).toBe(true);
    expect(getEntitiesTool.description.length).toBeGreaterThan(0);
  });
});
