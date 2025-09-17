import { jest } from '@jest/globals';
import { z } from 'zod';

import { toZodRawShape } from './mapping.js';

describe('mapping', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('toZodRawShape', () => {
    it('should return shape for ZodObject', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = toZodRawShape(schema);
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('age');
    });

    it('should throw error for non-ZodObject', () => {
      const schema = z.string();

      expect(() => toZodRawShape(schema)).toThrow('Provided schema is not a ZodObject');
    });
  });
});
