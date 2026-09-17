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
import { catalogOperationPolicy, catalogResult, readAnnotations, successOutputSchema } from './shared.js';

type JsonValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };

const jsonValueSchema = z.custom<JsonValue>();
const entitySchema = z
  .object({
    apiVersion: z.string().min(1),
    kind: z.string().min(1),
    metadata: z.object({ name: z.string().min(1) }).catchall(jsonValueSchema),
  })
  .catchall(jsonValueSchema);
const inputSchema = z.object({ entity: entitySchema, locationRef: z.string().min(1) });

/** Validates an entity using Backstage Catalog processing rules. */
export const validateEntityTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.VALIDATE_ENTITY,
  title: 'Validate a catalog entity',
  description: 'Validate a Backstage entity descriptor in the context of its source location.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogOperationPolicy,
  /**
   * Submits the entity descriptor to official Catalog validation.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.validateEntity(input.entity, input.locationRef),
      'Backstage could not validate the catalog entity'
    );
  },
});
