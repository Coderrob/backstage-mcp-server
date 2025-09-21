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
import {
  isBigInt,
  isError,
  isFunction,
  isNonEmptyString,
  isNumber,
  isObject,
  isString,
  isStringOrNumber,
} from './guards';

describe('guards', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('isString', () => {
    it.each([
      ['hello', true],
      ['', true],
      [123, false],
      [{}, false],
      [null, false],
      [undefined, false],
      [[], false],
    ])('should return %s for %p', (input, expected) => {
      expect(isString(input)).toBe(expected);
    });
  });

  describe('isFunction', () => {
    it.each([
      [(): void => {}, true],
      [function (): void {}, true],
      ['func', false],
      [123, false],
      [{}, false],
      [null, false],
      [undefined, false],
    ])('should return %s for %p', (input, expected) => {
      expect(isFunction(input)).toBe(expected);
    });
  });

  describe('isBigInt', () => {
    it.each([
      [BigInt(10), true],
      [10n, true],
      [10, false],
      ['10', false],
      [null, false],
      [undefined, false],
      [{}, false],
    ])('should return %s for %p', (input, expected) => {
      expect(isBigInt(input)).toBe(expected);
    });
  });

  describe('isObject', () => {
    it.each([
      [{}, true],
      [{ a: 1 }, true],
      [[], false],
      [null, false],
      ['object', false],
      [123, false],
      [undefined, false],
    ])('should return %s for %p', (input, expected) => {
      expect(isObject(input)).toBe(expected);
    });
  });

  describe('isNumber', () => {
    it.each([
      [0, true],
      [123, true],
      [-1, true],
      [NaN, true],
      [Infinity, true],
      ['123', false],
      [null, false],
      [undefined, false],
      [{}, false],
      [[], false],
    ])('should return %s for %p', (input, expected) => {
      expect(isNumber(input)).toBe(expected);
    });
  });

  describe('isNonEmptyString', () => {
    it.each([
      ['hello', true],
      [' ', true],
      ['', false],
      [123, false],
      [null, false],
      [undefined, false],
      [{}, false],
    ])('should return %s for %p', (input, expected) => {
      expect(isNonEmptyString(input)).toBe(expected);
    });
  });

  describe('isStringOrNumber', () => {
    it.each([
      ['hello', true],
      ['', true],
      [123, true],
      [0, true],
      [NaN, true],
      [null, false],
      [undefined, false],
      [{}, false],
      [[], false],
      [(): void => {}, false],
    ])('should return %s for %p', (input, expected) => {
      expect(isStringOrNumber(input)).toBe(expected);
    });
  });

  describe('isError', () => {
    it.each([
      [new Error('test'), true],
      [new TypeError('test'), true],
      [new ReferenceError('test'), true],
      [new RangeError('test'), true],
      ['error', false],
      [123, false],
      [{}, false],
      [null, false],
      [undefined, false],
      [[], false],
      [(): void => {}, false],
    ])('should return %s for %p', (input, expected) => {
      expect(isError(input)).toBe(expected);
    });
  });
});
