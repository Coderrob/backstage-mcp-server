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
import { catalogReadPolicy, catalogResult, readAnnotations, toEntityRef } from './shared.js';

const inputSchema = z
  .object({ entityRef: entityRefSchema.describe('Entity reference whose ancestors are requested.') })
  .describe('Retrieve the ancestor tree of a Catalog entity.');

/** Retrieves the ancestry tree for one Catalog entity. */
export const getEntityAncestorsTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITY_ANCESTORS,
  title: 'Get catalog entity ancestors',
  description: 'Retrieve the ancestry tree for a Backstage Catalog entity.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Resolves the entity reference and retrieves its ancestors.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.getEntityAncestors({ entityRef: toEntityRef(input.entityRef) }),
      'Backstage could not return catalog entity ancestors'
    );
  },
});
