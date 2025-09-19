/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { jest } from '@jest/globals';

import { VALID_ENTITY_KINDS } from '../../types/entities.js';
import { assertKind, assertNonEmptyString } from './assertions.js';

describe('assertions', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('assertNonEmptyString', () => {
    it('should return trimmed string for valid non-empty string', () => {
      expect(assertNonEmptyString('Test', '  hello  ')).toBe('hello');
    });

    it('should throw error for empty string', () => {
      expect(() => assertNonEmptyString('Test', '')).toThrow('Test must be a non-empty string');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => assertNonEmptyString('Test', '   ')).toThrow('Test must be a non-empty string');
    });

    it('should throw error for non-string value', () => {
      expect(() => assertNonEmptyString('Test', 123 as unknown as string)).toThrow('Test must be a non-empty string');
    });
  });

  describe('assertKind', () => {
    it('should return valid EntityKind', () => {
      const validKind = Array.from(VALID_ENTITY_KINDS)[0]; // Assuming at least one valid kind exists
      expect(assertKind(validKind)).toBe(validKind);
    });

    it('should throw error for invalid kind', () => {
      expect(() => assertKind('InvalidKind')).toThrow('Unknown entity kind');
    });

    it('should throw error for empty string', () => {
      expect(() => assertKind('')).toThrow('Kind must be a non-empty string');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => assertKind('   ')).toThrow('Kind must be a non-empty string');
    });
  });
});
