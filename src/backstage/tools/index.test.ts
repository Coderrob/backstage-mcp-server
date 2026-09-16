/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import { backstageCatalogTools } from './index.js';

describe('Backstage Catalog tool registry', () => {
  it('should exports all tools once in deterministic name order', () => {
    const names = backstageCatalogTools.map(({ name }) => name);
    expect(names).toHaveLength(Object.values(BackstageToolName).length);
    expect(names).toEqual(Object.values(BackstageToolName));
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(names.toSorted());
    expect(Object.isFrozen(backstageCatalogTools)).toBe(true);
  });
});
