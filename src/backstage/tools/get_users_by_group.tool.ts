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

import { BackstageEntityKind, BackstageRelation, BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import { groupLookupInputSchema, successOutputSchema } from '../../shared/schema.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { queryRelatedEntities } from './catalog-lookups.js';
import { catalogReadPolicy, catalogResult, readAnnotations } from './shared.js';

/** Get users by group. */
export const getUsersByGroupTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_USERS_BY_GROUP,
  title: 'Get users by group',
  description: 'Get Users with an explicit memberOf relation to the Group.',
  inputSchema: groupLookupInputSchema,
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
      queryRelatedEntities(context.catalogClient.queryEntities.bind(context.catalogClient), {
        relation: BackstageRelation.MEMBER_OF,
        targetRef: input.groupRef,
        kind: BackstageEntityKind.USER,
      }),
      'Backstage could not complete the get users by group lookup'
    );
  },
});
