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
 * Schema for adding a location to the catalog
 */
export const addLocationSchema = z.object({
  type: z.string().optional().describe('The type of location to add'),
  target: z.string().min(1).describe('The target location to add to the catalog'),
});

/**
 * Tool implementation for adding locations to the catalog
 * Follows Single Responsibility Principle - handles only location addition
 */
export class AddLocationToolImpl extends BaseCatalogTool {
  protected getSchema(): z.ZodSchema {
    return addLocationSchema;
  }

  protected async executeCatalogOperation(parsedParams: unknown, context: IToolExecutionContext): Promise<unknown> {
    const { target, type } = parsedParams as z.infer<typeof addLocationSchema>;

    return await context.catalogClient.addLocation({
      type,
      target,
    });
  }

  protected getErrorMessage(): string {
    return 'Failed to add location';
  }

  protected getErrorCode(): string {
    return 'ADD_LOCATION_ERROR';
  }
}
