import { jest } from '@jest/globals';
import { z } from 'zod';

import { IToolMetadata, ToolClass } from '../types/tools.js';
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
