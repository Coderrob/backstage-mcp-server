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
