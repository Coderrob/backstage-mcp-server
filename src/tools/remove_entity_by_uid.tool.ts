import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators/index.js';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types/index.js';
import { JsonToTextResponse, ToolErrorHandler } from '../utils/index.js';

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
