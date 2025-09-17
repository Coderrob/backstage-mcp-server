import { jest } from '@jest/globals';

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
});

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
