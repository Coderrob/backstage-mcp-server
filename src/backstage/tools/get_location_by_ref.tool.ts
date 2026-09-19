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
import { catalogOptionalResult, catalogReadPolicy, readAnnotations, successOutputSchema } from './shared.js';

const inputSchema = z.object({ locationRef: z.string().min(1) });

/** Retrieves a Catalog location by reference. */
export const getLocationByRefTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_LOCATION_BY_REF,
  title: 'Get catalog location by reference',
  description: 'Retrieve a Backstage Catalog location by its location reference.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Retrieves the referenced location and reports a typed not-found error when absent.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogOptionalResult(
      context.catalogClient.getLocationByRef(input.locationRef),
      'Catalog location',
      input.locationRef,
      'Backstage could not return the catalog location'
    );
  },
});
