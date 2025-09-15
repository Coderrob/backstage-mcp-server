import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { ToolErrorHandler } from '../utils/tool-error-handler';

const paramsSchema = z.object({
  uid: z.string().uuid(),
});

@Tool({
  name: 'remove_entity_by_uid',
  description: 'Remove an entity by UID.',
  paramsSchema,
})
export class RemoveEntityByUidTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    return ToolErrorHandler.executeTool(
      'remove_entity_by_uid',
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
