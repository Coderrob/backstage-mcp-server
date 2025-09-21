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
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { StandardExecutionStrategy } from './execution-strategies/standard-execution.strategy.js';
import { ToolMiddlewarePipeline } from './middleware/tool-middleware.pipeline.js';
import { ToolBuilder, ToolFactory } from './tool-builder.js';
import { ITool, IToolExecutionArgs, IToolExecutionContext, IToolExecutionStrategy, IToolMetadata } from './types.js';

// Mock dependencies
jest.mock('./execution-strategies/standard-execution.strategy.js');
jest.mock('./middleware/tool-middleware.pipeline.js');

// Define interface for accessing private members in tests
interface ToolBuilderPrivate {
  metadata: Partial<IToolMetadata>;
  executionStrategy?: IToolExecutionStrategy;
  toolClass?: new () => ITool;
}

// Mock tool class
class MockTool implements ITool {
  async execute(_params: IToolExecutionArgs, _context: IToolExecutionContext): Promise<CallToolResult> {
    return {
      content: [{ type: 'text', text: 'mock result' }],
    };
  }
}

describe('ToolBuilder', () => {
  let builder: ToolBuilder;
  let mockPipeline: jest.Mocked<ToolMiddlewarePipeline>;
  let mockStrategy: jest.Mocked<StandardExecutionStrategy>;

  beforeEach(() => {
    jest.clearAllMocks();
    builder = new ToolBuilder();
    mockPipeline = new ToolMiddlewarePipeline() as jest.Mocked<ToolMiddlewarePipeline>;
    mockStrategy = new StandardExecutionStrategy() as jest.Mocked<StandardExecutionStrategy>;
    // Mock the constructors
    (ToolMiddlewarePipeline as jest.MockedClass<typeof ToolMiddlewarePipeline>).mockImplementation(() => mockPipeline);
    (StandardExecutionStrategy as jest.MockedClass<typeof StandardExecutionStrategy>).mockImplementation(
      () => mockStrategy
    );
  });

  describe('fluent interface', () => {
    it('should chain method calls', () => {
      const result = builder
        .name('test-tool')
        .description('Test tool')
        .category('test')
        .tags('tag1', 'tag2')
        .version('1.0.0')
        .deprecated(false)
        .cacheable(true)
        .maxBatchSize(5)
        .requiresConfirmation(true)
        .requiresScopes('scope1', 'scope2');

      expect(result).toBe(builder);
    });

    it('should set metadata correctly', () => {
      builder
        .name('test-tool')
        .description('Test tool')
        .category('test')
        .tags('tag1', 'tag2')
        .version('1.0.0')
        .deprecated(true)
        .cacheable(false)
        .maxBatchSize(10)
        .requiresConfirmation(false)
        .requiresScopes('admin');

      // Access private metadata for testing
      const metadata = (builder as unknown as ToolBuilderPrivate).metadata;
      expect(metadata.name).toBe('test-tool');
      expect(metadata.description).toBe('Test tool');
      expect(metadata.category).toBe('test');
      expect(metadata.tags).toEqual(['tag1', 'tag2']);
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.deprecated).toBe(true);
      expect(metadata.cacheable).toBe(false);
      expect(metadata.maxBatchSize).toBe(10);
      expect(metadata.requiresConfirmation).toBe(false);
      expect(metadata.requiredScopes).toEqual(['admin']);
    });

    it('should set schema', () => {
      const schema = z.object({ param: z.string() });
      builder.schema(schema);
      const metadata = (builder as unknown as ToolBuilderPrivate).metadata;
      expect(metadata.paramsSchema).toBe(schema);
    });
  });

  describe('middleware', () => {
    it('should add middleware to pipeline', () => {
      const middleware = {
        name: 'test',
        priority: 1,
        execute: jest.fn<() => Promise<CallToolResult>>().mockResolvedValue({ content: [] }),
      };
      builder.use(middleware);
      expect(mockPipeline.use).toHaveBeenCalledWith(middleware);
    });
  });

  describe('strategy', () => {
    it('should set execution strategy', () => {
      const strategy = mockStrategy;
      builder.withStrategy(strategy);
      expect((builder as unknown as ToolBuilderPrivate).executionStrategy).toBe(strategy);
    });
  });

  describe('tool class', () => {
    it('should set tool class', () => {
      builder.withClass(MockTool);
      expect((builder as unknown as ToolBuilderPrivate).toolClass).toBe(MockTool);
    });
  });

  describe('build', () => {
    it('should build tool successfully', () => {
      builder.name('test-tool').description('Test tool').withClass(MockTool);

      const tool = builder.build();
      expect(tool).toBeDefined();
      expect(tool.getMetadata().name).toBe('test-tool');
      expect(tool.getMetadata().description).toBe('Test tool');
    });

    it('should use default strategy if none provided', () => {
      builder.name('test-tool').description('Test tool').withClass(MockTool);

      builder.build();
      expect(StandardExecutionStrategy).toHaveBeenCalled();
    });

    it('should throw error if name is missing', () => {
      builder.description('Test tool').withClass(MockTool);
      expect(() => builder.build()).toThrow('Tool name and description are required');
    });

    it('should throw error if description is missing', () => {
      builder.name('test-tool').withClass(MockTool);
      expect(() => builder.build()).toThrow('Tool name and description are required');
    });

    it('should throw error if tool class is missing', () => {
      builder.name('test-tool').description('Test tool');
      expect(() => builder.build()).toThrow('Tool class must be specified using withClass()');
    });

    it('should throw error if maxBatchSize is invalid', () => {
      builder.name('test-tool').description('Test tool').withClass(MockTool).maxBatchSize(0);
      expect(() => builder.build()).toThrow('maxBatchSize must be greater than 0');
    });
  });
});

describe('ToolFactory', () => {
  it('should create a new builder', () => {
    const builder = ToolFactory.create();
    expect(builder).toBeInstanceOf(ToolBuilder);
  });

  it('should create read tool with defaults', () => {
    const builder = ToolFactory.createReadTool();
    const metadata = (builder as unknown as ToolBuilderPrivate).metadata;
    expect(metadata.category).toBe('read');
    expect(metadata.cacheable).toBe(true);
    expect(metadata.tags).toEqual(['readonly', 'query']);
  });

  it('should create write tool with defaults', () => {
    const builder = ToolFactory.createWriteTool();
    const metadata = (builder as unknown as ToolBuilderPrivate).metadata;
    expect(metadata.category).toBe('write');
    expect(metadata.requiresConfirmation).toBe(true);
    expect(metadata.tags).toEqual(['write', 'mutation']);
  });

  it('should create batch tool with defaults', () => {
    const builder = ToolFactory.createBatchTool(20);
    const metadata = (builder as unknown as ToolBuilderPrivate).metadata;
    expect(metadata.category).toBe('batch');
    expect(metadata.maxBatchSize).toBe(20);
    expect(metadata.tags).toEqual(['batch', 'bulk']);
  });

  it('should create admin tool with defaults', () => {
    const builder = ToolFactory.createAdminTool();
    const metadata = (builder as unknown as ToolBuilderPrivate).metadata;
    expect(metadata.category).toBe('admin');
    expect(metadata.requiresConfirmation).toBe(true);
    expect(metadata.requiredScopes).toEqual(['admin']);
    expect(metadata.tags).toEqual(['admin', 'privileged']);
  });
});
