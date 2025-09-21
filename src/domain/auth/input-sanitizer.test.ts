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

import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';

import { InputSanitizer } from './input-sanitizer.js';

describe('InputSanitizer', () => {
  let sanitizer: InputSanitizer;

  beforeEach(() => {
    sanitizer = new InputSanitizer();
  });

  describe('sanitizeString', () => {
    it('should sanitize valid string', () => {
      const result = sanitizer.sanitizeString('  hello world  ', 'test');
      expect(result).toBe('hello world');
    });

    it('should throw error for non-string input', () => {
      expect(() => sanitizer.sanitizeString(123 as unknown as string, 'test')).toThrow(
        'Invalid input type for test: expected string, got number'
      );
    });

    it('should throw error for too long string', () => {
      const longString = 'a'.repeat(10001);
      expect(() => sanitizer.sanitizeString(longString, 'test')).toThrow(
        'Input too long for test: 10001 characters (max: 10000)'
      );
    });

    it('should filter out non-printable characters', () => {
      const result = sanitizer.sanitizeString('hello\x00world\x01', 'test');
      expect(result).toBe('helloworld');
    });

    it('should throw error for dangerous content', () => {
      expect(() => sanitizer.sanitizeString('<script>alert(1)</script>', 'test')).toThrow(
        'Potentially dangerous content detected in test'
      );
      expect(() => sanitizer.sanitizeString('javascript:alert(1)', 'test')).toThrow(
        'Potentially dangerous content detected in test'
      );
    });

    it('should allow safe content', () => {
      const result = sanitizer.sanitizeString('safe-content-123', 'test');
      expect(result).toBe('safe-content-123');
    });
  });

  describe('sanitizeArray', () => {
    it('should sanitize valid array', () => {
      const result = sanitizer.sanitizeArray(['a', 'b', 'c'], 'test');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should throw error for non-array input', () => {
      expect(() => sanitizer.sanitizeArray('not array' as unknown as string[], 'test')).toThrow(
        'Invalid input type for test: expected array, got string'
      );
    });

    it('should throw error for too large array', () => {
      const largeArray = new Array(1001).fill('item');
      expect(() => sanitizer.sanitizeArray(largeArray, 'test')).toThrow(
        'Array too long for test: 1001 items (max: 1000)'
      );
    });

    it('should apply item sanitizer', () => {
      const result = sanitizer.sanitizeArray(['  a  ', '  b  '], 'test', (item) => item.trim());
      expect(result).toEqual(['a', 'b']);
    });
  });

  describe('sanitizeEntityRef', () => {
    it('should sanitize string entity ref', () => {
      const result = sanitizer.sanitizeEntityRef('component:default/my-component');
      expect(result).toBe('component:default/my-component');
    });

    it('should sanitize object entity ref', () => {
      const result = sanitizer.sanitizeEntityRef({
        kind: 'component',
        namespace: 'default',
        name: 'my-component',
      });
      expect(result).toEqual({
        kind: 'component',
        namespace: 'default',
        name: 'my-component',
      });
    });

    it('should throw error for invalid entity ref', () => {
      expect(() =>
        sanitizer.sanitizeEntityRef(123 as unknown as string | { kind: string; namespace: string; name: string })
      ).toThrow('Invalid entity reference format');
    });

    it('should validate parts of object entity ref', () => {
      expect(() =>
        sanitizer.sanitizeEntityRef({
          kind: '<script>',
          namespace: 'default',
          name: 'my-component',
        })
      ).toThrow('Potentially dangerous content detected in entityRef.kind');
    });
  });

  describe('sanitizeFilter', () => {
    it('should sanitize valid filter', () => {
      const filter = [
        { key: 'kind', values: ['component', 'api'] },
        { key: 'namespace', values: ['default'] },
      ];
      const result = sanitizer.sanitizeFilter(filter);
      expect(result).toEqual(filter);
    });

    it('should validate filter structure', () => {
      const filter = [{ key: '<script>', values: ['component'] }];
      expect(() => sanitizer.sanitizeFilter(filter)).toThrow('Potentially dangerous content detected in filter.key');
    });

    it('should validate filter values', () => {
      const filter = [{ key: 'kind', values: ['<script>'] }];
      expect(() => sanitizer.sanitizeFilter(filter)).toThrow('Potentially dangerous content detected in filter.value');
    });
  });

  describe('validateWithSchema', () => {
    it('should validate with schema', () => {
      const result = sanitizer.validateWithSchema('input', z.string(), 'test');
      expect(result).toBe('input');
    });

    it('should throw error for invalid data', () => {
      expect(() => sanitizer.validateWithSchema('input', z.number(), 'test')).toThrow(
        'Validation failed for test: Expected number, received string'
      );
    });

    it('should throw error for ZodError', () => {
      expect(() => sanitizer.validateWithSchema('input', z.number(), 'test')).toThrow(
        'Validation failed for test: Expected number, received string'
      );
    });
  });

  describe('checkForInjection', () => {
    it('should allow safe input', () => {
      expect(() => sanitizer.checkForInjection('safe input')).not.toThrow();
    });

    it('should detect SQL keywords', () => {
      expect(() => sanitizer.checkForInjection('SELECT * FROM users')).toThrow(
        'Potentially dangerous SQL pattern detected in input'
      );
      expect(() => sanitizer.checkForInjection('union select')).toThrow(
        'Potentially dangerous SQL pattern detected in input'
      );
    });

    it('should detect SQL comments', () => {
      expect(() => sanitizer.checkForInjection('input -- comment')).toThrow(
        'Potentially dangerous SQL pattern detected in input'
      );
      expect(() => sanitizer.checkForInjection('input /* comment */')).toThrow(
        'Potentially dangerous SQL pattern detected in input'
      );
    });

    it('should detect quotes and dashes', () => {
      expect(() => sanitizer.checkForInjection("input ' quote")).toThrow(
        'Potentially dangerous SQL pattern detected in input'
      );
    });
  });

  describe('sanitizeUrl', () => {
    it('should sanitize valid URL', () => {
      const result = sanitizer.sanitizeUrl('  https://example.com/path  ');
      expect(result).toBe('https://example.com/path');
    });

    it('should throw error for invalid protocol', () => {
      expect(() => sanitizer.sanitizeUrl('ftp://example.com')).toThrow('Invalid URL format');
    });

    it('should throw error for malformed URL', () => {
      expect(() => sanitizer.sanitizeUrl('not a url')).toThrow('Invalid URL format');
    });

    it('should throw error for dangerous content in URL', () => {
      expect(() => sanitizer.sanitizeUrl('https://example.com/<script>')).toThrow(
        'Potentially dangerous content detected in url'
      );
    });
  });
});
