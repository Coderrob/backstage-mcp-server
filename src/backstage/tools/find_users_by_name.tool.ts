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
import { findUsersInputSchema, successOutputSchema } from '../../shared/schema.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { findUsers } from './catalog-lookups.js';
import { catalogReadPolicy, catalogResult, readAnnotations } from './shared.js';

/** Find users by name. */
export const findUsersByNameTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.FIND_USERS_BY_NAME,
  title: 'Find users by name',
  description:
    'Find User candidates by firstName, lastName, or both as case-insensitive displayName substrings. Returns all visible matches within lookup bounds; does not infer identity or name order.',
  inputSchema: findUsersInputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Executes the curated lookup through the official Catalog client.
   * @param invocation - Validated criteria and Backstage client context.
   * @returns Structured MCP success containing the matched entities.
   */
  async handler({ input, context }) {
    return catalogResult(
      findUsers(context.catalogClient.queryEntities.bind(context.catalogClient), input),
      'Backstage lookup failed; narrow the scope if the lookup budget was exceeded'
    );
  },
});
