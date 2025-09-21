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
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { StandardExecutionStrategy } from './execution-strategies/standard-execution.strategy.js';
import { ToolMiddlewarePipeline } from './middleware/tool-middleware.pipeline.js';
import {
  IEnhancedTool,
  ITool,
  IToolExecutionArgs,
  IToolExecutionContext,
  IToolExecutionStrategy,
  IToolMetadata,
  IToolMiddleware,
} from './types.js';

/**
 * Fluent builder for creating and configuring tools
 * Implements the Builder Pattern for complex tool configuration
 */
export class ToolBuilder {
  private metadata: Partial<IToolMetadata> = {};
  private middlewarePipeline = new ToolMiddlewarePipeline();
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
   * Set the parameter schema using Zod for type safety
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
   * Add tags to the tool for organization and discovery
   */
  tags(...tags: string[]): this {
    this.metadata.tags = [...(this.metadata.tags || []), ...tags];
    return this;
  }

  /**
   * Set tool version for compatibility tracking
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
   * Mark tool as cacheable for performance optimization
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
   * Require confirmation for potentially destructive operations
   */
  requiresConfirmation(requires = true): this {
    this.metadata.requiresConfirmation = requires;
    return this;
  }

  /**
   * Set required authentication scopes for authorization
   */
  requiresScopes(...scopes: string[]): this {
    this.metadata.requiredScopes = scopes;
    return this;
  }

  /**
   * Add middleware to the tool execution pipeline
   * Implements the Chain of Responsibility pattern
   */
  use(middleware: IToolMiddleware): this {
    this.middlewarePipeline.use(middleware);
    return this;
  }

  /**
   * Set the execution strategy
   * Implements the Strategy pattern for different execution behaviors
   */
  withStrategy(strategy: IToolExecutionStrategy): this {
    this.executionStrategy = strategy;
    return this;
  }

  /**
   * Set the tool implementation class
   * Follows Dependency Inversion Principle
   */
  withClass<T extends ITool>(toolClass: new () => T): this {
    this.toolClass = toolClass;
    return this;
  }

  /**
   * Build the configured tool
   * @returns A fully configured tool instance
   */
  build(): IEnhancedTool {
    this.validateConfiguration();

    const metadata: IToolMetadata = {
      name: this.metadata.name!,
      description: this.metadata.description!,
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

    return new EnhancedTool(
      this.toolClass!,
      metadata,
      this.middlewarePipeline,
      this.executionStrategy || new StandardExecutionStrategy()
    );
  }

  private validateConfiguration(): void {
    if (!this.metadata.name || !this.metadata.description) {
      throw new Error('Tool name and description are required');
    }

    if (!this.toolClass) {
      throw new Error('Tool class must be specified using withClass()');
    }

    if (this.metadata.maxBatchSize !== undefined && this.metadata.maxBatchSize <= 0) {
      throw new Error('maxBatchSize must be greater than 0');
    }
  }
}

/**
 * Enhanced tool wrapper that supports middleware and strategies
 * Implements the Decorator pattern to enhance tool functionality
 */
class EnhancedTool implements IEnhancedTool {
  constructor(
    private toolClass: new () => ITool,
    private metadata: IToolMetadata,
    private middlewarePipeline: ToolMiddlewarePipeline,
    private executionStrategy: IToolExecutionStrategy
  ) {}

  async execute(params: IToolExecutionArgs, context: IToolExecutionContext): Promise<CallToolResult> {
    // Validate schema if provided
    if (this.metadata.paramsSchema) {
      try {
        this.metadata.paramsSchema.parse(params);
      } catch (error) {
        throw new Error(`Parameter validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const tool = new this.toolClass();

    // Execute through middleware pipeline and strategy
    return this.middlewarePipeline.execute(params, context, async (processedParams, processedContext) => {
      return this.executionStrategy.execute(tool, processedParams, processedContext, this.metadata);
    });
  }

  /**
   * Get tool metadata - always available
   */
  getMetadata(): IToolMetadata {
    return { ...this.metadata };
  }

  /**
   * Get middleware information
   */
  getMiddleware(): IToolMiddleware[] {
    return this.middlewarePipeline.getMiddleware();
  }
}

/**
 * Factory for creating tools using the builder pattern
 * Implements the Factory pattern with fluent interface
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
   * Applies common patterns for read-only operations
   */
  static createReadTool(): ToolBuilder {
    return new ToolBuilder().category('read').cacheable(true).tags('readonly', 'query');
  }

  /**
   * Create a write tool builder with common write configurations
   * Applies common patterns for write operations with safety measures
   */
  static createWriteTool(): ToolBuilder {
    return new ToolBuilder().category('write').requiresConfirmation(true).tags('write', 'mutation');
  }

  /**
   * Create a batch tool builder with batch configurations
   * Applies common patterns for batch operations
   */
  static createBatchTool(maxBatchSize = 10): ToolBuilder {
    return new ToolBuilder().category('batch').maxBatchSize(maxBatchSize).tags('batch', 'bulk');
  }

  /**
   * Create an admin tool builder with security configurations
   * Applies common patterns for administrative operations
   */
  static createAdminTool(): ToolBuilder {
    return new ToolBuilder()
      .category('admin')
      .requiresConfirmation(true)
      .requiresScopes('admin')
      .tags('admin', 'privileged');
  }
}
