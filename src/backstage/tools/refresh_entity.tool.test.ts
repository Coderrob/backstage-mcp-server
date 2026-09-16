/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { refreshEntityTool } from './refresh_entity.tool.js';

describe('refresh_entity tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(refreshEntityTool).toMatchObject({ kind: 'tool', name: 'refresh_entity' });
    expect(refreshEntityTool.inputSchema.safeParse({ entityRef: 'component:default/api' }).success).toBe(true);
    expect(refreshEntityTool.description.length).toBeGreaterThan(0);
  });
});
