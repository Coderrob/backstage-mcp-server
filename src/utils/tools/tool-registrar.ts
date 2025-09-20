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

import {
  ITool,
  IToolExecutionContext,
  IToolMetadata,
  IToolRegistrar,
  IToolRegistrationContext,
} from '../../types/tools.js';
import { isZodObject, isZodSchema } from '../core/guards.js';
import { logger } from '../core/logger.js';

/**
 * Default implementation of the tool registrar.
 * Handles registration of tools with the MCP server including schema validation.
 */
export class DefaultToolRegistrar implements IToolRegistrar {
  constructor(private readonly context: IToolRegistrationContext) {}

  /**
   * Registers a tool with the MCP server using the modern MCP SDK registerTool API.
   *
   * @param toolClass - The tool class instance to register
   * @param metadata - Tool metadata containing name, description, and parameter schema
   * @throws Error if tool registration fails due to invalid schema or MCP server issues
   *
   * @example
   * ```typescript
   * const registrar = new DefaultToolRegistrar(context);
   * registrar.register(MyToolClass, {
   *   name: 'my-tool',
   *   description: 'A useful tool',
   *   paramsSchema: z.object({ input: z.string() })
   * });
   * ```
   */
  register(toolClass: ITool, { name, description, paramsSchema }: IToolMetadata): void {
    logger.debug(`Registering tool: ${name}`);

    const inputSchema = this.extractInputSchema(paramsSchema);
    this.registerWithMcpServer(name, description, inputSchema, toolClass);

    logger.debug(`Tool registered successfully: ${name}`);
  }

  /**
   * Extracts the input schema from a Zod schema for MCP SDK compatibility.
   * @param paramsSchema - The Zod schema to extract from
   * @returns The extracted schema shape or undefined
   */
  private extractInputSchema(paramsSchema?: z.ZodTypeAny): Record<string, z.ZodTypeAny> | undefined {
    if (!isZodSchema(paramsSchema)) {
      return undefined;
    }

    if (isZodObject(paramsSchema)) {
      return paramsSchema.shape;
    }

    // For non-object schemas, wrap in a value property
    return { value: paramsSchema };
  }

  /**
   * Registers the tool with the MCP server.
   * @param name - Tool name
   * @param description - Tool description
   * @param inputSchema - Extracted input schema
   * @param toolClass - Tool class instance
   */
  private registerWithMcpServer(
    name: string,
    description: string,
    inputSchema: Record<string, z.ZodTypeAny> | undefined,
    toolClass: ITool
  ): void {
    try {
      this.context.server.registerTool(
        name,
        {
          title: description,
          description,
          inputSchema,
        },
        async (args: Record<string, unknown>) => {
          const executionContext: IToolExecutionContext = {
            ...this.context,
          };
          return toolClass.execute(args, executionContext);
        }
      );
    } catch (error) {
      logger.error(`Failed to register tool ${name}`, { error });
      throw error;
    }
  }
}
