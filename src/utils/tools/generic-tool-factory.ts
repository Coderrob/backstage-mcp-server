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

import { ApiStatus, type CallToolResult, IToolRegistrationContext, ToolName } from './common-imports.js';

/**
 * Generic tool operation interface following SOLID principles
 */
export interface IToolOperation<TParams extends z.ZodTypeAny, TResult = unknown> {
  execute(params: z.infer<TParams>, context: IToolRegistrationContext): Promise<TResult>;
}

/**
 * Strategy pattern for different tool execution modes
 */
export interface IToolExecutionStrategy<TParams extends z.ZodTypeAny> {
  execute(
    operation: IToolOperation<TParams>,
    params: z.infer<TParams>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult>;
}

/**
 * Standard execution strategy implementation
 */
export class StandardExecutionStrategy<TParams extends z.ZodTypeAny> implements IToolExecutionStrategy<TParams> {
  async execute(
    operation: IToolOperation<TParams>,
    params: z.infer<TParams>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    try {
      const result = await operation.execute(params, context);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: ApiStatus.SUCCESS, data: result }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: ApiStatus.ERROR,
                data: {
                  message: error instanceof Error ? error.message : 'Unknown error',
                  code: 'EXECUTION_ERROR',
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
}

/**
 * Generic tool factory using factory pattern and generics
 */
export class GenericToolFactory {
  private static readonly strategies = new Map<string, IToolExecutionStrategy<z.ZodTypeAny>>();

  /**
   * Register a custom execution strategy
   */
  static registerStrategy<TParams extends z.ZodTypeAny>(name: string, strategy: IToolExecutionStrategy<TParams>): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Create a tool class using generics and factory pattern
   */
  static createTool<TParams extends z.ZodTypeAny, TOperation extends IToolOperation<TParams>>(config: {
    name: ToolName;
    description: string;
    paramsSchema: TParams;
    operation: new () => TOperation;
    strategy?: string;
  }): new () => {
    execute(request: z.infer<TParams>, context: IToolRegistrationContext): Promise<CallToolResult>;
  } {
    const strategy = this.strategies.get(config.strategy || 'standard') || new StandardExecutionStrategy<TParams>();

    // Create a proper class constructor
    const ToolClass = class {
      static readonly toolName = config.name;
      static readonly description = config.description;
      static readonly paramsSchema = config.paramsSchema;

      static async execute(request: z.infer<TParams>, context: IToolRegistrationContext): Promise<CallToolResult> {
        const operation = new config.operation();
        return strategy.execute(operation, request, context);
      }
    };

    return ToolClass as unknown as new () => {
      execute(request: z.infer<TParams>, context: IToolRegistrationContext): Promise<CallToolResult>;
    };
  }
}

/**
 * Decorator factory for automatic tool registration
 */
export function ToolFactory<TParams extends z.ZodTypeAny>(config: {
  name: ToolName;
  description: string;
  paramsSchema: TParams;
  strategy?: string;
}): <TOperation extends IToolOperation<TParams>>(
  operationClass: new () => TOperation
) => new () => {
  execute(request: z.infer<TParams>, context: IToolRegistrationContext): Promise<CallToolResult>;
} {
  return function <TOperation extends IToolOperation<TParams>>(operationClass: new () => TOperation) {
    return GenericToolFactory.createTool({
      ...config,
      operation: operationClass,
    });
  };
}
