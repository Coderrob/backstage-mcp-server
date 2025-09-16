import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators/index.js';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types/index.js';
import { JsonToTextResponse, ToolErrorHandler } from '../utils/index.js';

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
