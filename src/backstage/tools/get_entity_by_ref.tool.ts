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
  catalogOptionalResult,
  catalogReadPolicy,
  entityRefSchema,
  readAnnotations,
  successOutputSchema,
  toEntityRef,
} from './shared.js';

/** Input accepted by the single-entity lookup tool. */
const getEntityByRefInputSchema = z.object({ entityRef: entityRefSchema });

/** Retrieves one Catalog entity by compound reference. */
export const getEntityByRefTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITY_BY_REF,
  title: 'Get a catalog entity',
  description: 'Retrieve one Backstage Catalog entity by string or structured compound reference.',
  inputSchema: getEntityByRefInputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Resolves one entity reference and reports a typed not-found error when absent.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    const entityRef = toEntityRef(input.entityRef);
    return catalogOptionalResult(
      context.catalogClient.getEntityByRef(entityRef),
      'Catalog entity',
      entityRef,
      'Backstage could not return the catalog entity'
    );
  },
});
