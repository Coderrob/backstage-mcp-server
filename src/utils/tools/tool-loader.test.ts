import { jest } from '@jest/globals';
import * as os from 'os';
import * as path from 'path';
import { z } from 'zod';

import {
  ITool,
  IToolFactory,
  IToolMetadata,
  IToolMetadataProvider,
  IToolRegistrar,
  IToolValidator,
  ToolClass,
} from '../../types/tools.js';

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

// Mock fs/promises
jest.unstable_mockModule('fs/promises', () => ({
  writeFile: jest.fn(),
}));

// Mock logger
jest.unstable_mockModule('../core/logger.js', () => ({
  logger: mockLogger,
}));

// Mock allTools - set up before importing ToolLoader
class MockToolA {
  static execute = jest.fn();
}
class MockToolB {
  static execute = jest.fn();
}
const NotATool = jest.fn();

jest.unstable_mockModule('../../tools/index.js', () => ({
  ToolA: MockToolA,
  ToolB: MockToolB,
  NotATool: NotATool,
}));

type MockToolFactory = {
  loadTool: jest.MockedFunction<(filePath: string) => Promise<ITool | undefined>>;
};

type MockToolRegistrar = {
  register: jest.MockedFunction<(toolClass: ITool, metadata: IToolMetadata) => void>;
};

type MockToolValidator = {
  validate: jest.MockedFunction<(metadata: IToolMetadata, file: string) => void>;
};

type MockToolMetadataProvider = {
  getMetadata: jest.MockedFunction<(toolClass: ToolClass | object) => IToolMetadata | undefined>;
};

type ToolLoaderWithPrivate = typeof ToolLoader & {
  manifest: { name: string; description: string; params: string[] }[];
  addToManifest(metadata: IToolMetadata): void;
};

let ToolLoader: typeof import('./tool-loader.js').ToolLoader;

beforeAll(async () => {
  const executeA = jest.fn();
  const executeB = jest.fn();
  await jest.unstable_mockModule('../../tools/index.js', () => ({
    ToolA: class {
      static execute = executeA;
    },
    ToolB: class {
      static execute = executeB;
    },
    NotATool: jest.fn(),
  }));

  const toolLoaderModule = await import('./tool-loader.js');
  ToolLoader = toolLoaderModule.ToolLoader;
});

describe('ToolLoader', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  let mockFactory: MockToolFactory;
  let mockRegistrar: MockToolRegistrar;
  let mockValidator: MockToolValidator;
  let mockMetadataProvider: MockToolMetadataProvider;
  let loader: InstanceType<typeof ToolLoader>;

  beforeEach(() => {
    mockFactory = {
      loadTool: jest.fn(),
    };
    mockRegistrar = {
      register: jest.fn(),
    };
    mockValidator = {
      validate: jest.fn(),
    };
    mockMetadataProvider = {
      getMetadata: jest.fn(),
    };

    loader = new ToolLoader(
      mockFactory as unknown as IToolFactory,
      mockRegistrar as unknown as IToolRegistrar,
      mockValidator as unknown as IToolValidator,
      mockMetadataProvider as unknown as IToolMetadataProvider
    );
  });

  describe('registerAll', () => {
    it('should register valid tools', async () => {
      // Mock metadata - return valid metadata for first 2 tools, null for others
      const metadataA: IToolMetadata = {
        name: 'tool-a',
        description: 'Tool A description',
        paramsSchema: z.object({ param1: z.string() }),
      };
      const metadataB: IToolMetadata = {
        name: 'tool-b',
        description: 'Tool B description',
        paramsSchema: z.object({ param2: z.number() }),
      };

      mockMetadataProvider.getMetadata
        .mockReturnValueOnce(metadataA)
        .mockReturnValueOnce(metadataB)
        .mockReturnValue(undefined); // Return undefined for all other calls

      const loader = new ToolLoader(mockFactory, mockRegistrar, mockValidator, mockMetadataProvider);

      await loader.registerAll();

      expect(mockMetadataProvider.getMetadata).toHaveBeenCalledTimes(2); // 2 mock tools
      expect(mockValidator.validate).toHaveBeenCalledTimes(2); // Both have valid metadata
      expect(mockRegistrar.register).toHaveBeenCalledTimes(2); // Both are registered
      // Note: We can't predict which specific tool classes will be passed, so we just check the metadata
      expect(mockRegistrar.register).toHaveBeenCalledWith(expect.any(Function), metadataA);
      expect(mockRegistrar.register).toHaveBeenCalledWith(expect.any(Function), metadataB);
    });

    it('should skip tools with invalid metadata', async () => {
      const MockTool = jest.fn();
      MockTool.prototype = { execute: jest.fn() };

      mockMetadataProvider.getMetadata.mockReturnValue(undefined);

      const allTools = { Tool: MockTool };
      jest.doMock('../../tools/index.js', () => allTools);

      const { ToolLoader: MockedToolLoader } = await import('./tool-loader.js');
      const mockedLoader = new MockedToolLoader(
        mockFactory as unknown as IToolFactory,
        mockRegistrar as unknown as IToolRegistrar,
        mockValidator as unknown as IToolValidator,
        mockMetadataProvider as unknown as IToolMetadataProvider
      );

      await mockedLoader.registerAll();

      expect(mockValidator.validate).not.toHaveBeenCalled();
      expect(mockRegistrar.register).not.toHaveBeenCalled();
    });

    it('should skip tools that fail validation', async () => {
      const MockTool = jest.fn();
      MockTool.prototype = { execute: jest.fn() };

      const metadata: IToolMetadata = {
        name: 'tool',
        description: 'Tool description',
        paramsSchema: z.object({}),
      };

      mockMetadataProvider.getMetadata.mockReturnValue(metadata);
      mockValidator.validate.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      const allTools = { Tool: MockTool };
      jest.doMock('../../tools/index.js', () => allTools);

      const { ToolLoader: MockedToolLoader } = await import('./tool-loader.js');
      const mockedLoader = new MockedToolLoader(
        mockFactory as unknown as IToolFactory,
        mockRegistrar as unknown as IToolRegistrar,
        mockValidator as unknown as IToolValidator,
        mockMetadataProvider as unknown as IToolMetadataProvider
      );

      await mockedLoader.registerAll();

      expect(mockValidator.validate).toHaveBeenCalled();
      expect(mockRegistrar.register).not.toHaveBeenCalled();
    });
  });

  describe('exportManifest', () => {
    it('should export manifest to file', async () => {
      const filePath = path.join(os.tmpdir(), 'test-manifest.json');
      const manifestData = [{ name: 'tool1', description: 'desc', params: ['param1'] }];

      // Access private manifest
      (loader as unknown as ToolLoaderWithPrivate).manifest = manifestData;

      await expect(loader.exportManifest(filePath)).resolves.not.toThrow();
    });
  });

  describe('addToManifest', () => {
    it('should add tool to manifest with params', () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
        paramsSchema: z.object({ param1: z.string(), param2: z.number() }),
      };

      (loader as unknown as ToolLoaderWithPrivate).addToManifest(metadata);

      expect((loader as unknown as ToolLoaderWithPrivate).manifest).toEqual([
        {
          name: 'test-tool',
          description: 'Test tool',
          params: ['param1', 'param2'],
        },
      ]);
    });

    it('should add tool to manifest without params', () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
        paramsSchema: undefined,
      };

      (loader as unknown as ToolLoaderWithPrivate).addToManifest(metadata);

      expect((loader as unknown as ToolLoaderWithPrivate).manifest).toEqual([
        {
          name: 'test-tool',
          description: 'Test tool',
          params: [],
        },
      ]);
    });
  });
});
