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

import { IToolRegistrationContext } from './common-imports.js';
import { IToolOperation } from './generic-tool-factory.js';

/**
 * Advanced Tool Creation Example
 * Demonstrates: Builder Pattern, Fluent API, Method Chaining
 */
export class ToolBuilder {
  private name = '';
  private description = '';
  private paramsSchema?: z.ZodTypeAny;
  private operation?: new () => IToolOperation<z.ZodTypeAny>;

  /**
   * Set the tool name
   */
  withName(name: string): this {
    this.name = name;
    return this;
  }

  /**
   * Set the tool description
   */
  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  /**
   * Set the parameter schema
   */
  withParams<T extends z.ZodTypeAny>(schema: T): this {
    this.paramsSchema = schema;
    return this;
  }

  /**
   * Set the operation class
   */
  withOperation<TOperation extends IToolOperation<z.ZodTypeAny>>(operation: new () => TOperation): this {
    this.operation = operation;
    return this;
  }

  /**
   * Build the tool using the factory pattern
   */
  build(): {
    name: string;
    description: string;
    paramsSchema: z.ZodTypeAny;
    operation: new () => IToolOperation<z.ZodTypeAny>;
  } {
    if (!this.name || !this.description || !this.paramsSchema || !this.operation) {
      throw new Error('Tool configuration incomplete');
    }

    // This would integrate with the ToolRegistry
    return {
      name: this.name,
      description: this.description,
      paramsSchema: this.paramsSchema,
      operation: this.operation,
    };
  }
}

/**
 * Fluent API for tool creation
 */
export class ToolFactory {
  static create(): ToolBuilder {
    return new ToolBuilder();
  }
}

/**
 * Example: Creating a tool using the fluent builder pattern
 */
export const ExampleTool: {
  name: string;
  description: string;
  paramsSchema: z.ZodTypeAny;
  operation: new () => IToolOperation<z.ZodTypeAny>;
} = ToolFactory.create()
  .withName('example-tool')
  .withDescription('An example tool demonstrating advanced patterns')
  .withParams(
    z.object({
      input: z.string(),
      count: z.number().optional(),
    })
  )
  .withOperation(
    class implements IToolOperation<typeof ExampleTool.paramsSchema> {
      static readonly paramsSchema = z.object({
        input: z.string(),
        count: z.number().optional(),
      });

      async execute(
        params: z.infer<typeof ExampleTool.paramsSchema>,
        _context: IToolRegistrationContext
      ): Promise<string> {
        const result = `${params.input}${params.count ? ` (count: ${params.count})` : ''}`;
        return result;
      }
    }
  )
  .build();
