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

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogResult, catalogWritePolicy, destructiveAnnotations, successOutputSchema } from './shared.js';

const inputSchema = z.object({ locationId: z.string().min(1) });

/** Permanently removes one Catalog location by identifier. */
export const removeLocationByIdTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.REMOVE_LOCATION_BY_ID,
  title: 'Remove a catalog location',
  description: 'Permanently remove a Backstage Catalog location by its identifier.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: destructiveAnnotations,
  policy: catalogWritePolicy,
  /**
   * Removes the selected Catalog location.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.removeLocationById(input.locationId),
      'Backstage could not remove the catalog location'
    );
  },
});
