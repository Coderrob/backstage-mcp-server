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

import { defineTool } from '../../mcp/definitions.js';
import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import type { BackstageMcpContext } from '../../types/index.js';
import {
  catalogReadPolicy,
  catalogResult,
  queryEntitiesInputSchema,
  readAnnotations,
  successOutputSchema,
  toQueryEntitiesRequest,
} from './shared.js';

/** Queries Backstage Catalog entities with the current query API. */
export const getEntitiesTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITIES,
  title: 'Get catalog entities',
  description: 'Query Catalog entities with filters, full-text search, ordering, projection, and pagination.',
  inputSchema: queryEntitiesInputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Queries Catalog entities using validated current or cursor parameters.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.queryEntities(toQueryEntitiesRequest(input)),
      'Backstage could not return catalog entities'
    );
  },
});
