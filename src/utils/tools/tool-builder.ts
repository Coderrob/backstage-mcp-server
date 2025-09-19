import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { ITool, IToolExecutionArgs, IToolExecutionContext, IToolMetadata } from '../../types/tools.js';
import { IToolExecutionStrategy } from './execution-strategies.js';
import { IToolMiddleware } from './middleware.js';

/**
 * Fluent builder for creating and configuring tools
 */
export class ToolBuilder {
  private metadata: Partial<IToolMetadata> = {};
  private middleware: IToolMiddleware[] = [];
  private executionStrategy?: IToolExecutionStrategy;
  private toolClass?: new () => ITool;

  /**
   * Set the tool name
   */
  name(name: string): this {
    this.metadata.name = name;
    return this;
  }

  /**
   * Set the tool description
   */
  description(description: string): this {
    this.metadata.description = description;
    return this;
  }

  /**
   * Set the parameter schema
   */
  schema<T extends z.ZodSchema<unknown>>(schema: T): this {
    this.metadata.paramsSchema = schema;
    return this;
  }

  /**
   * Set the tool category
   */
  category(category: string): this {
    this.metadata.category = category;
    return this;
  }

  /**
   * Add tags to the tool
   */
  tags(...tags: string[]): this {
    this.metadata.tags = [...(this.metadata.tags || []), ...tags];
    return this;
  }

  /**
   * Set tool version
   */
  version(version: string): this {
    this.metadata.version = version;
    return this;
  }

  /**
   * Mark tool as deprecated
   */
  deprecated(deprecated = true): this {
    this.metadata.deprecated = deprecated;
    return this;
  }

  /**
   * Mark tool as cacheable
   */
  cacheable(cacheable = true): this {
    this.metadata.cacheable = cacheable;
    return this;
  }

  /**
   * Set maximum batch size for batch operations
   */
  maxBatchSize(size: number): this {
    this.metadata.maxBatchSize = size;
    return this;
  }

  /**
   * Require confirmation for write operations
   */
  requiresConfirmation(requires = true): this {
    this.metadata.requiresConfirmation = requires;
    return this;
  }

  /**
   * Set required authentication scopes
   */
  requiresScopes(...scopes: string[]): this {
    this.metadata.requiredScopes = scopes;
    return this;
  }

  /**
   * Add middleware to the tool execution pipeline
   */
  use(middleware: IToolMiddleware): this {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Set the execution strategy
   */
  withStrategy(strategy: IToolExecutionStrategy): this {
    this.executionStrategy = strategy;
    return this;
  }

  /**
   * Set the tool class to instantiate
   */
  withClass<T extends ITool>(toolClass: new () => T): this {
    this.toolClass = toolClass;
    return this;
  }

  /**
   * Build the configured tool
   */
  build(): ITool {
    if (!this.metadata.name || !this.metadata.description) {
      throw new Error('Tool name and description are required');
    }

    if (!this.toolClass) {
      throw new Error('Tool class must be specified');
    }

    const metadata: IToolMetadata = {
      name: this.metadata.name,
      description: this.metadata.description,
      paramsSchema: this.metadata.paramsSchema,
      category: this.metadata.category,
      tags: this.metadata.tags,
      version: this.metadata.version,
      deprecated: this.metadata.deprecated,
      cacheable: this.metadata.cacheable,
      requiresConfirmation: this.metadata.requiresConfirmation,
      requiredScopes: this.metadata.requiredScopes,
      maxBatchSize: this.metadata.maxBatchSize,
    };

    return new EnhancedTool(this.toolClass, metadata, this.middleware, this.executionStrategy);
  }
}

/**
 * Enhanced tool wrapper that supports middleware and strategies
 */
class EnhancedTool implements ITool {
  constructor(
    private toolClass: new () => ITool,
    private metadata: IToolMetadata,
    private middleware: IToolMiddleware[],
    private executionStrategy?: IToolExecutionStrategy
  ) {}

  async execute(args: IToolExecutionArgs, context: IToolExecutionContext): Promise<CallToolResult> {
    const tool = new this.toolClass();

    // If no middleware or strategy, execute directly
    if (this.middleware.length === 0 && !this.executionStrategy) {
      return tool.execute(args, context);
    }

    // Use execution strategy if provided
    if (this.executionStrategy) {
      return this.executionStrategy.execute(tool, args, context, this.metadata);
    }

    // Use middleware pipeline
    let index = 0;
    const next = async (nextArgs: IToolExecutionArgs, nextContext: IToolExecutionContext): Promise<CallToolResult> => {
      if (index < this.middleware.length) {
        const middleware = this.middleware[index++];
        return middleware.execute(nextArgs, nextContext, next);
      }
      return tool.execute(nextArgs, nextContext);
    };

    return next(args, context);
  }

  getMetadata(): IToolMetadata {
    return this.metadata;
  }
}

/**
 * Factory for creating tools using the builder pattern
 */
export class ToolFactory {
  /**
   * Create a new tool builder
   */
  static create(): ToolBuilder {
    return new ToolBuilder();
  }

  /**
   * Create a read tool builder with common read configurations
   */
  static createReadTool(): ToolBuilder {
    return new ToolBuilder().category('read').cacheable(true).tags('readonly');
  }

  /**
   * Create a write tool builder with common write configurations
   */
  static createWriteTool(): ToolBuilder {
    return new ToolBuilder().category('write').requiresConfirmation(true).tags('write');
  }

  /**
   * Create a batch tool builder with batch configurations
   */
  static createBatchTool(maxBatchSize = 10): ToolBuilder {
    return new ToolBuilder().category('batch').maxBatchSize(maxBatchSize).tags('batch');
  }
}
