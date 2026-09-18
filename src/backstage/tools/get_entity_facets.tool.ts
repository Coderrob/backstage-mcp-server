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
import {
  catalogFilterSchema,
  catalogReadPolicy,
  catalogResult,
  readAnnotations,
  successOutputSchema,
} from './shared.js';

const inputSchema = z.object({ filter: catalogFilterSchema.optional(), facets: z.array(z.string().min(1)).min(1) });

/** Retrieves aggregate facet values for Catalog entity fields. */
export const getEntityFacetsTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITY_FACETS,
  title: 'Get catalog entity facets',
  description: 'Retrieve facet counts for one or more Backstage Catalog entity fields.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Retrieves facet values using the validated filter and field list.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.getEntityFacets(input),
      'Backstage could not return catalog entity facets'
    );
  },
});
