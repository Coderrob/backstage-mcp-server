import { z } from 'zod';

import {
  ITool,
  IToolFactory,
  IToolMetadata,
  IToolMetadataProvider,
  IToolRegistrar,
  IToolValidator,
  RawToolMetadata,
} from '../../types';
import { ToolLoader } from './tool-loader';

describe('ToolLoader', () => {
  const validTool: jest.Mocked<ITool> = {
    execute: jest.fn(),
  };

  const validMetadata: RawToolMetadata = {
    name: 'demoTool',
    description: 'Demo',
    paramsSchema: { foo: 'bar' },
  };

  const mockFactory: jest.Mocked<IToolFactory> = {
    loadTool: jest.fn(),
  };

  const mockRegistrar: jest.Mocked<IToolRegistrar> = {
    register: jest.fn(),
  };

  const mockValidator: jest.Mocked<IToolValidator> = {
    validate: jest.fn(),
  };

  const mockMetadataProvider: jest.Mocked<IToolMetadataProvider> = {
    getMetadata: jest.fn(),
  };

  class TestToolLoader extends ToolLoader {
    protected async findToolFiles(): Promise<string[]> {
      return ['test.tool.js'];
    }
  }

  const loader = new TestToolLoader('', mockFactory, mockRegistrar, mockValidator, mockMetadataProvider);

  beforeEach(() => {});

  afterEach(() => jest.clearAllMocks());

  it('should skip invalid tool files', async () => {
    mockFactory.loadTool.mockResolvedValue(undefined);
    await loader.registerAll();
    expect(mockRegistrar.register).not.toHaveBeenCalled();
  });

  it('should skip tools without metadata', async () => {
    mockFactory.loadTool.mockResolvedValue(validTool);
    mockMetadataProvider.getMetadata.mockReturnValue(undefined);
    await loader.registerAll();
    expect(mockRegistrar.register).not.toHaveBeenCalled();
  });

  it('should register valid tools', async () => {
    mockFactory.loadTool.mockResolvedValue(validTool);
    mockMetadataProvider.getMetadata.mockReturnValue(validMetadata);
    await loader.registerAll();
    expect(mockValidator.validate).toHaveBeenCalledWith(validMetadata, expect.any(String));
    expect(mockRegistrar.register).toHaveBeenCalledWith(validTool, validMetadata);
  });

  describe('addToManifest', () => {
    class TestableToolLoader extends ToolLoader {
      protected async findToolFiles(): Promise<string[]> {
        return [];
      }
      getManifest(): ToolManifestEntry[] {
        return this.manifest;
      }
    }

    let testLoader: TestableToolLoader;

    beforeEach(() => {
      testLoader = new TestableToolLoader('', mockFactory, mockRegistrar, mockValidator, mockMetadataProvider);
    });

    it('should extract parameter names from ZodObject schema', () => {
      const zodSchema = z.object({
        param1: z.string(),
        param2: z.number(),
        param3: z.boolean(),
      });

      const metadataWithZod: IToolMetadata = {
        name: 'testTool',
        description: 'Test tool with Zod schema',
        paramsSchema: zodSchema,
      };

      testLoader.addToManifest(metadataWithZod);

      const manifest = testLoader.getManifest();
      expect(manifest).toHaveLength(1);
      expect(manifest[0]).toEqual({
        name: 'testTool',
        description: 'Test tool with Zod schema',
        params: ['param1', 'param2', 'param3'],
      });
    });

    it('should handle non-ZodObject schema', () => {
      const nonZodSchema = z.string(); // Not an object schema

      const metadataWithNonZod: IToolMetadata = {
        name: 'testTool',
        description: 'Test tool with non-object schema',
        paramsSchema: nonZodSchema,
      };

      testLoader.addToManifest(metadataWithNonZod);

      const manifest = testLoader.getManifest();
      expect(manifest).toHaveLength(1);
      expect(manifest[0]).toEqual({
        name: 'testTool',
        description: 'Test tool with non-object schema',
        params: [],
      });
    });

    it('should handle undefined paramsSchema', () => {
      const metadataWithoutSchema: IToolMetadata = {
        name: 'testTool',
        description: 'Test tool without schema',
        paramsSchema: undefined,
      };

      testLoader.addToManifest(metadataWithoutSchema);

      const manifest = testLoader.getManifest();
      expect(manifest).toHaveLength(1);
      expect(manifest[0]).toEqual({
        name: 'testTool',
        description: 'Test tool without schema',
        params: [],
      });
    });

    it('should handle empty ZodObject schema', () => {
      const emptyZodSchema = z.object({});

      const metadataWithEmptyZod: IToolMetadata = {
        name: 'testTool',
        description: 'Test tool with empty Zod schema',
        paramsSchema: emptyZodSchema,
      };

      testLoader.addToManifest(metadataWithEmptyZod);

      const manifest = testLoader.getManifest();
      expect(manifest).toHaveLength(1);
      expect(manifest[0]).toEqual({
        name: 'testTool',
        description: 'Test tool with empty Zod schema',
        params: [],
      });
    });
  });
});
