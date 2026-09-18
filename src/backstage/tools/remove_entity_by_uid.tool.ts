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
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogResult, catalogWritePolicy, destructiveAnnotations, successOutputSchema } from './shared.js';

const inputSchema = z.object({ uid: z.string().uuid() });

/** Permanently removes one Catalog entity by UID. */
export const removeEntityByUidTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.REMOVE_ENTITY_BY_UID,
  title: 'Remove a catalog entity',
  description: 'Permanently remove a Backstage Catalog entity by its unique identifier.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: destructiveAnnotations,
  policy: catalogWritePolicy,
  /**
   * Removes the selected Catalog entity.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.removeEntityByUid(input.uid),
      'Backstage could not remove the catalog entity'
    );
  },
});
