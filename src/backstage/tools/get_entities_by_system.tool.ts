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

import { BackstageRelation, BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import { successOutputSchema, systemLookupInputSchema } from '../../shared/schema.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { collectDescendants } from './catalog-lookups.js';
import { catalogReadPolicy, catalogResult, readAnnotations } from './shared.js';

/** Get entities by system. */
export const getEntitiesBySystemTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITIES_BY_SYSTEM,
  title: 'Get entities by system',
  description: 'Get direct entities in a System through partOf; recursive true includes descendants.',
  inputSchema: systemLookupInputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Executes the contextual lookup using the official Backstage Catalog client.
   * @param invocation - Validated lookup input and Backstage client context.
   * @returns Structured MCP result containing the matching entities.
   */
  async handler({ input, context }) {
    return catalogResult(
      collectDescendants(context.catalogClient.queryEntities.bind(context.catalogClient), {
        relation: BackstageRelation.PART_OF,
        targetRef: input.systemRef,
        recursive: input.recursive,
      }),
      'Backstage could not complete the get entities by system lookup'
    );
  },
});
