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
import { catalogResult, catalogWritePolicy, toEntityRef, writeAnnotations } from './shared.js';

const inputSchema = z
  .object({ entityRef: entityRefSchema.describe('Entity reference to refresh.') })
  .describe('Request a Catalog entity refresh.');

/** Requests a refresh of one Catalog entity. */
export const refreshEntityTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.REFRESH_ENTITY,
  title: 'Refresh a catalog entity',
  description: 'Request immediate refresh processing for a Backstage Catalog entity.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: writeAnnotations,
  policy: catalogWritePolicy,
  /**
   * Resolves the entity reference and requests a refresh.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.refreshEntity(toEntityRef(input.entityRef)),
      'Backstage could not refresh the catalog entity'
    );
  },
});
