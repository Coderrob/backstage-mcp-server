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

/** Compatibility alias for querying Catalog entities by filter. */
export const getEntitiesByQueryTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITIES_BY_QUERY,
  title: 'Get catalog entities by query',
  description: 'Query Catalog entities using the legacy name with current Backstage query capabilities.',
  inputSchema: queryEntitiesInputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Runs the compatibility entity-query operation.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.queryEntities(toQueryEntitiesRequest(input)),
      'Backstage could not return queried catalog entities'
    );
  },
});
