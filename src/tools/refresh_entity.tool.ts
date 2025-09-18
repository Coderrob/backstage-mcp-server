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

import { Tool } from '../decorators/tool.decorator.js';
import { ApiStatus } from '../types/apis.js';
import { ToolName } from '../types/constants.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { JsonToTextResponse } from '../utils/formatting/responses.js';
import { ToolErrorHandler } from '../utils/tools/tool-error-handler.js';

const paramsSchema = z.object({
  entityRef: z.string(),
});

@Tool({
  name: ToolName.REFRESH_ENTITY,
  description: 'Trigger a refresh of an entity.',
  paramsSchema,
})
export class RefreshEntityTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.REFRESH_ENTITY,
      'refreshEntity',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        await ctx.catalogClient.refreshEntity(args.entityRef);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS });
      },
      request,
      context,
      true
    );
  }
}
