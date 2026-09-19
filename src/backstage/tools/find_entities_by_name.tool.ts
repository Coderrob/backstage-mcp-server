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

import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import { entityNameLookupInputSchema, successOutputSchema } from '../../shared/schema.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { searchEntitiesByName } from './catalog-lookups.js';
import { catalogReadPolicy, catalogResult, readAnnotations } from './shared.js';

/** Find entities by name. */
export const findEntitiesByNameTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.FIND_ENTITIES_BY_NAME,
  title: 'Find entities by name',
  description:
    'Find candidates by a substring of metadata.name or metadata.title; optionally restrict kind and namespace.',
  inputSchema: entityNameLookupInputSchema,
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
      searchEntitiesByName(context.catalogClient.queryEntities.bind(context.catalogClient), input),
      'Backstage could not complete the find entities by name lookup'
    );
  },
});
