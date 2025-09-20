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
  AddLocationOperation,
  GetEntitiesOperation,
  GetEntityByRefOperation,
  ValidateEntityOperation,
} from './catalog-operations.js';
import { CallToolResult, IToolRegistrationContext, ToolName } from './common-imports.js';
import { ToolRegistry } from './tool-registry.js';

/**
 * Advanced Tool Registration Module
 * Demonstrates: Registry Pattern, Dependency Injection, SOLID Principles
 */
export class AdvancedToolRegistrar {
  /**
   * Register all catalog tools using advanced patterns
   */
  static registerAll(): void {
    // Register Add Location Tool
    ToolRegistry.register({
      name: ToolName.ADD_LOCATION,
      description: 'Create a new location in the catalog.',
      paramsSchema: AddLocationOperation.paramsSchema,
      operation: AddLocationOperation,
    });

    // Register Get Entities Tool
    ToolRegistry.register({
      name: ToolName.GET_ENTITIES,
      description:
        'Get all entities in the catalog. Supports pagination and JSON:API formatting for enhanced LLM context.',
      paramsSchema: GetEntitiesOperation.paramsSchema,
      operation: GetEntitiesOperation,
    });

    // Register Get Entity by Reference Tool
    ToolRegistry.register({
      name: ToolName.GET_ENTITY_BY_REF,
      description: 'Get a single entity by its reference (namespace/name or compound ref).',
      paramsSchema: GetEntityByRefOperation.paramsSchema,
      operation: GetEntityByRefOperation,
    });

    // Register Validate Entity Tool
    ToolRegistry.register({
      name: ToolName.VALIDATE_ENTITY,
      description: 'Validate an entity structure.',
      paramsSchema: ValidateEntityOperation.paramsSchema,
      operation: ValidateEntityOperation,
    });
  }

  /**
   * Get a tool by name
   */
  static getTool(name: ToolName):
    | {
        execute: (request: unknown, context: IToolRegistrationContext) => Promise<CallToolResult>;
        description: string;
        paramsSchema: z.ZodTypeAny;
      }
    | undefined {
    return ToolRegistry.get(name);
  }

  /**
   * Get all registered tools
   */
  static getAllTools(): Map<
    ToolName,
    {
      execute: (request: unknown, context: IToolRegistrationContext) => Promise<CallToolResult>;
      description: string;
      paramsSchema: z.ZodTypeAny;
    }
  > {
    return ToolRegistry.getAll();
  }

  /**
   * Check if a tool exists
   */
  static hasTool(name: ToolName): boolean {
    return ToolRegistry.has(name);
  }

  /**
   * Get the number of registered tools
   */
  static getToolCount(): number {
    return ToolRegistry.size();
  }
}
