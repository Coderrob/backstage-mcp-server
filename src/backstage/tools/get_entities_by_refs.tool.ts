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

import { defineTool } from '@coderrob/mcp-kernel';
import { z } from 'zod';

import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import { entityRefSchema, fieldsSchema, successOutputSchema } from '../../shared/schema.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogReadPolicy, catalogResult, readAnnotations, toEntityRef } from './shared.js';

const inputSchema = z
  .object({
    entityRefs: z.array(entityRefSchema).min(1).describe('Entity references to retrieve.'),
    fields: fieldsSchema.describe('Optional entity fields to return.'),
  })
  .describe('Retrieve multiple Catalog entities by reference.');

/** Retrieves multiple Catalog entities by reference. */
export const getEntitiesByRefsTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITIES_BY_REFS,
  title: 'Get catalog entities by references',
  description: 'Retrieve multiple Backstage Catalog entities by string or structured compound references.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Retrieves all requested entities in one official-client operation.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    const request = { entityRefs: input.entityRefs.map(toEntityRef), fields: input.fields };
    return catalogResult(
      context.catalogClient.getEntitiesByRefs(request),
      'Backstage could not return catalog entities by reference'
    );
  },
});
