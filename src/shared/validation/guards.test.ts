/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { isNonEmptyString } from './guards.js';

describe('isNonEmptyString', () => {
  it.each([
    ['text', true],
    ['', false],
    [0, false],
    [null, false],
  ])('should classify %j as %j', (value, expected) => {
    expect(isNonEmptyString(value)).toBe(expected);
  });
});
