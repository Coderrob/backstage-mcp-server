import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types';
import { JsonToTextResponse, ToolErrorHandler } from '../utils';

const paramsSchema = z.object({
  uid: z.string().uuid(),
});

@Tool({
  name: ToolName.REMOVE_ENTITY_BY_UID,
  description: 'Remove an entity by UID.',
  paramsSchema,
})
export class RemoveEntityByUidTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.REMOVE_ENTITY_BY_UID,
      'removeEntityByUid',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        await ctx.catalogClient.removeEntityByUid(args.uid);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS });
      },
      request,
      context,
      true
    );
  }
}
