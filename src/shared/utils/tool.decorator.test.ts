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

import { IToolMetadata, ToolClass } from '../../shared/types/tools.js';
import { Tool, toolMetadataMap } from './tool.decorator.js';

describe('tool.decorator', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Tool decorator', () => {
    it('should add metadata to the map', () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
      };

      @Tool(metadata)
      class TestTool {}

      expect(toolMetadataMap.get(TestTool as ToolClass)).toBe(metadata);
    });

    it('should work with different metadata', () => {
      const metadata1: IToolMetadata = {
        name: 'tool1',
        description: 'Tool 1',
      };
      const metadata2: IToolMetadata = {
        name: 'tool2',
        description: 'Tool 2',
        paramsSchema: z.object({}),
      };

      @Tool(metadata1)
      class Tool1 {}

      @Tool(metadata2)
      class Tool2 {}

      expect(toolMetadataMap.get(Tool1 as ToolClass)).toBe(metadata1);
      expect(toolMetadataMap.get(Tool2 as ToolClass)).toBe(metadata2);
    });
  });
});
