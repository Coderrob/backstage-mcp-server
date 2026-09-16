/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { validateEntityTool } from './validate_entity.tool.js';

describe('validate_entity tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(validateEntityTool).toMatchObject({ kind: 'tool', name: 'validate_entity' });
    expect(
      validateEntityTool.inputSchema.safeParse({
        entity: {
          apiVersion: 'v1',
          kind: 'Component',
          metadata: { name: 'api', tags: ['service'] },
          spec: { owner: 'platform', lifecycle: 'production' },
        },
        locationRef: 'url:test',
      }).success
    ).toBe(true);
    expect(validateEntityTool.description.length).toBeGreaterThan(0);
  });
});
