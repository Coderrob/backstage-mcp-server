import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { ToolErrorHandler } from '../utils/tool-error-handler';

const paramsSchema = z.object({
  entityRef: z.string(),
});

@Tool({
  name: 'refresh_entity',
  description: 'Trigger a refresh of an entity.',
  paramsSchema,
})
export class RefreshEntityTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    return ToolErrorHandler.executeTool(
      'refresh_entity',
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
