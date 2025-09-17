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
