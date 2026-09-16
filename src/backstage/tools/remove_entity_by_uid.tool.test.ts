/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { removeEntityByUidTool } from './remove_entity_by_uid.tool.js';

describe('remove_entity_by_uid tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(removeEntityByUidTool).toMatchObject({ kind: 'tool', name: 'remove_entity_by_uid' });
    expect(removeEntityByUidTool.inputSchema.safeParse({ uid: '123e4567-e89b-12d3-a456-426614174000' }).success).toBe(
      true
    );
    expect(removeEntityByUidTool.description.length).toBeGreaterThan(0);
  });
});
