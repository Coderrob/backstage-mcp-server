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
import { BackstageToolName, CatalogLocationConflictMode } from '../../shared/constants/backstage-catalog.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogResult, catalogWritePolicy, successOutputSchema, writeAnnotations } from './shared.js';

/** Input accepted when registering or dry-running a Catalog location. */
const addLocationInputSchema = z.object({
  type: z.string().min(1).optional(),
  target: z.string().min(1),
  dryRun: z.boolean().optional(),
  onConflict: z.nativeEnum(CatalogLocationConflictMode).optional(),
});

/** Adds a location to the Backstage Catalog. */
export const addLocationTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.ADD_LOCATION,
  title: 'Add a catalog location',
  description: 'Add a location to the Backstage Catalog, or validate it using dry-run mode.',
  inputSchema: addLocationInputSchema,
  outputSchema: successOutputSchema,
  annotations: writeAnnotations,
  policy: catalogWritePolicy,
  /**
   * Adds or dry-runs a Catalog location.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(context.catalogClient.addLocation(input), 'Backstage could not add the catalog location');
  },
});
