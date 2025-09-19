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
import 'reflect-metadata';

import { z } from 'zod';

import { type CallToolResult, type IToolRegistrationContext, ToolName } from './common-imports.js';
import { GenericToolFactory, IToolExecutionStrategy } from './generic-tool-factory.js';

/**
 * Registry pattern for managing tools using advanced patterns
 */
export class ToolRegistry {
  private static readonly tools = new Map<
    ToolName,
    {
      execute: (request: unknown, context: IToolRegistrationContext) => Promise<CallToolResult>;
      description: string;
      paramsSchema: z.ZodTypeAny;
    }
  >();

  /**
   * Register a tool using the factory pattern
   */
  static register<
    TParams extends z.ZodTypeAny,
    TOperation extends {
      new (): { execute(params: z.infer<TParams>, context: IToolRegistrationContext): Promise<unknown> };
    },
  >(config: {
    name: ToolName;
    description: string;
    paramsSchema: TParams;
    operation: TOperation;
    strategy?: IToolExecutionStrategy<TParams>;
  }): void {
    if (config.strategy) {
      GenericToolFactory.registerStrategy(`${config.name}_strategy`, config.strategy);
    }

    const ToolClass = GenericToolFactory.createTool({
      name: config.name,
      description: config.description,
      paramsSchema: config.paramsSchema,
      operation: config.operation,
      strategy: config.strategy ? `${config.name}_strategy` : undefined,
    });

    const toolInstance = new ToolClass();
    this.tools.set(config.name, {
      execute: toolInstance.execute.bind(toolInstance),
      description: config.description,
      paramsSchema: config.paramsSchema,
    });
  }

  /**
   * Get a registered tool
   */
  static get(name: ToolName):
    | {
        execute: (request: unknown, context: IToolRegistrationContext) => Promise<CallToolResult>;
        description: string;
        paramsSchema: z.ZodTypeAny;
      }
    | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  static getAll(): Map<
    ToolName,
    {
      execute: (request: unknown, context: IToolRegistrationContext) => Promise<CallToolResult>;
      description: string;
      paramsSchema: z.ZodTypeAny;
    }
  > {
    return new Map(this.tools);
  }

  /**
   * Check if a tool is registered
   */
  static has(name: ToolName): boolean {
    return this.tools.has(name);
  }

  /**
   * Get tool count
   */
  static size(): number {
    return this.tools.size;
  }
}
