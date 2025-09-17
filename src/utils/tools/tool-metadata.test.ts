import { jest } from '@jest/globals';

import { IToolMetadata, ToolClass } from '../../types/tools.js';
import { ReflectToolMetadataProvider } from './tool-metadata.js';

// Mock the decorator map
jest.mock('../../decorators/tool.decorator.js', () => ({
  toolMetadataMap: new Map(),
}));

import { toolMetadataMap } from '../../decorators/tool.decorator.js';

describe('ReflectToolMetadataProvider', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    toolMetadataMap.clear();
  });

  let provider: ReflectToolMetadataProvider;

  beforeEach(() => {
    provider = new ReflectToolMetadataProvider();
  });

  describe('getMetadata', () => {
    it('should return metadata for class constructor', () => {
      const toolClass = class TestTool {
        static execute(): void {}
      };
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
      };

      toolMetadataMap.set(toolClass as unknown as ToolClass, metadata);

      const result = provider.getMetadata(toolClass);

      expect(result).toBe(metadata);
    });

    it('should return metadata for instance', () => {
      const toolClass = class TestTool {
        static execute(): void {}
      };
      const instance = new toolClass();
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
      };

      toolMetadataMap.set(toolClass as unknown as ToolClass, metadata);

      const result = provider.getMetadata(instance);

      expect(result).toBe(metadata);
    });

    it('should return undefined for unknown class', () => {
      const toolClass = class TestTool {
        static execute(): void {}
      };

      const result = provider.getMetadata(toolClass);

      expect(result).toBeUndefined();
    });

    it('should return undefined for null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = provider.getMetadata(null as any);

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-object', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = provider.getMetadata('string' as any);

      expect(result).toBeUndefined();
    });
  });
});
