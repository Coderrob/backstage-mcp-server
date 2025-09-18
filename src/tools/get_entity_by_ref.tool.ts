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
import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { inputSanitizer } from '../auth/input-sanitizer.js';
import { Tool } from '../decorators/tool.decorator.js';
import { ApiStatus } from '../types/apis.js';
import { ToolName } from '../types/constants.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { JsonToTextResponse } from '../utils/formatting/responses.js';
import { ToolErrorHandler } from '../utils/tools/tool-error-handler.js';

const compoundEntityRefSchema = z.object({
  kind: z.string(),
  namespace: z.string(),
  name: z.string(),
});

const paramsSchema = z.object({
  entityRef: z.union([z.string(), compoundEntityRefSchema]),
});

@Tool({
  name: ToolName.GET_ENTITY_BY_REF,
  description: 'Get a single entity by its reference (namespace/name or compound ref).',
  paramsSchema,
})
export class GetEntityByRefTool {
  static async execute(
    { entityRef }: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_ENTITY_BY_REF,
      'get_entity_by_ref',
      async ({ entityRef: ref }: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        // Sanitize entity reference input
        const sanitizedEntityRef = inputSanitizer.sanitizeEntityRef(ref);
        const result = await ctx.catalogClient.getEntityByRef(sanitizedEntityRef);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      { entityRef },
      context,
      true // Use JSON:API error format
    );
  }
}
