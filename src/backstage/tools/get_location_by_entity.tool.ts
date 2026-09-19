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
import { entityRefSchema, successOutputSchema } from '../../shared/schema.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogOptionalResult, catalogReadPolicy, readAnnotations, toEntityRef } from './shared.js';

const inputSchema = z
  .object({ entityRef: entityRefSchema.describe('Entity reference whose source location is requested.') })
  .describe('Retrieve the source location of a Catalog entity.');

/** Retrieves the Catalog location associated with an entity. */
export const getLocationByEntityTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_LOCATION_BY_ENTITY,
  title: 'Get catalog location by entity',
  description: 'Retrieve the Backstage Catalog location associated with an entity.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Resolves the entity reference and retrieves its source location.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    const entityRef = toEntityRef(input.entityRef);
    return catalogOptionalResult(
      context.catalogClient.getLocationByEntity(entityRef),
      'Catalog location for entity',
      entityRef,
      'Backstage could not return the entity location'
    );
  },
});
