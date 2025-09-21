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

import { IToolExecutionContext } from '../../core/types.js';
import { BaseCatalogTool } from './base-catalog.tool.js';

/**
 * Schema for getting an entity by reference
 */
export const getEntityByRefSchema = z.object({
  entityRef: z
    .union([
      z.string().min(1).describe('Entity reference as a string (e.g., "kind:namespace/name")'),
      z
        .object({
          kind: z.string().min(1).describe('Entity kind'),
          namespace: z.string().min(1).describe('Entity namespace'),
          name: z.string().min(1).describe('Entity name'),
        })
        .describe('Entity reference as an object'),
    ])
    .describe('Reference to the entity to retrieve'),
});

/**
 * Tool implementation for getting a single entity by reference
 * Follows Single Responsibility Principle - handles only single entity retrieval
 */
export class GetEntityByRefToolImpl extends BaseCatalogTool {
  protected getSchema(): z.ZodSchema {
    return getEntityByRefSchema;
  }

  protected async executeCatalogOperation(parsedParams: unknown, context: IToolExecutionContext): Promise<unknown> {
    const { entityRef } = parsedParams as z.infer<typeof getEntityByRefSchema>;

    // Normalize entity reference to string format
    const normalizedRef =
      typeof entityRef === 'string' ? entityRef : `${entityRef.kind}:${entityRef.namespace}/${entityRef.name}`;

    const result = await context.catalogClient.getEntityByRef(normalizedRef);

    if (!result) {
      throw new Error(`Entity not found: ${normalizedRef}`);
    }

    return result;
  }

  protected getErrorMessage(): string {
    return 'Failed to get entity';
  }

  protected getErrorCode(): string {
    return 'GET_ENTITY_ERROR';
  }
}
