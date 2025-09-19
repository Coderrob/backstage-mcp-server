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
import { z } from 'zod';

import { IToolMetadata } from '../../types/tools.js';
import { DefaultToolValidator } from './tool-validator.js';

describe('DefaultToolValidator', () => {
  let validator: DefaultToolValidator;

  beforeEach(() => {
    validator = new DefaultToolValidator();
  });

  describe('validate', () => {
    it('should validate correct metadata without throwing', () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
      };
      const file = '/path/to/tool.js';

      expect(() => validator.validate(metadata, file)).not.toThrow();
    });

    it('should throw for invalid metadata', () => {
      const metadata = {
        name: '', // Invalid: empty name
        description: 'Test tool',
      };
      const file = '/path/to/tool.js';

      expect(() => validator.validate(metadata, file)).toThrow();
    });

    it('should validate metadata with paramsSchema as plain object', () => {
      const metadata = {
        name: 'test-tool',
        description: 'Test tool',
        paramsSchema: {
          type: 'object',
          properties: {
            param1: { type: 'string' },
          },
        },
      } as unknown as IToolMetadata; // Cast through unknown since this represents runtime metadata that may have plain object schemas
      const file = '/path/to/tool.js';

      expect(() => validator.validate(metadata, file)).not.toThrow();
    });

    it('should validate metadata with paramsSchema as Zod schema', () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
        paramsSchema: z.object({
          param1: z.string(),
        }),
      };
      const file = '/path/to/tool.js';

      expect(() => validator.validate(metadata, file)).not.toThrow();
    });
  });
});
