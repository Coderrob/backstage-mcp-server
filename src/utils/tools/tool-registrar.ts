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
import { ITool, IToolMetadata, IToolRegistrar, IToolRegistrationContext } from '../../types/tools.js';
import { logger } from '../core/logger.js';
import { toZodRawShape } from '../core/mapping.js';

/**
 * Default implementation of the tool registrar.
 * Handles registration of tools with the MCP server including schema validation.
 */
export class DefaultToolRegistrar implements IToolRegistrar {
  constructor(private readonly context: IToolRegistrationContext) {}

  /**
   * Registers a tool with the MCP server.
   * Converts Zod schema to raw shape and handles registration errors.
   * @param toolClass - The tool class to register
   * @param metadata - Tool metadata including name, description, and parameter schema
   * @throws Error if tool registration fails
   */
  register(toolClass: ITool, { name, description, paramsSchema }: IToolMetadata): void {
    try {
      logger.debug(`Registering tool: ${name}`);
      const schemaArg = paramsSchema ? toZodRawShape(paramsSchema) : {};
      this.context.server.tool(name, description, schemaArg, async (args, extra) =>
        toolClass.execute(args, { ...this.context, extra })
      );
      logger.debug(`Tool registered successfully: ${name}`);
    } catch (error) {
      logger.error(`Failed to register tool ${name}`, { error });
      throw error;
    }
  }
}
