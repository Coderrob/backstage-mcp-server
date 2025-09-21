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
 * Schema for getting entities with query parameters
 */
export const getEntitiesSchema = z.object({
  filter: z
    .array(
      z.object({
        key: z.string().min(1).describe('Filter key'),
        values: z.array(z.string()).describe('Filter values'),
      })
    )
    .optional()
    .describe('Array of filters to apply'),
  fields: z.array(z.string()).optional().describe('Specific fields to include in the response'),
  limit: z.number().int().positive().max(1000).optional().describe('Maximum number of entities to return'),
  offset: z.number().int().min(0).optional().describe('Number of entities to skip'),
  format: z.enum(['standard', 'jsonapi']).optional().default('jsonapi').describe('Response format'),
});

/**
 * Tool implementation for getting multiple entities from the catalog
 * Follows Single Responsibility Principle - handles only entity querying
 */
export class GetEntitiesToolImpl extends BaseCatalogTool {
  protected getSchema(): z.ZodSchema {
    return getEntitiesSchema;
  }

  protected async executeCatalogOperation(parsedParams: unknown, context: IToolExecutionContext): Promise<unknown> {
    return await context.catalogClient.getEntities(parsedParams as z.infer<typeof getEntitiesSchema>);
  }

  protected getErrorMessage(): string {
    return 'Failed to get entities';
  }

  protected getErrorCode(): string {
    return 'GET_ENTITIES_ERROR';
  }
}
