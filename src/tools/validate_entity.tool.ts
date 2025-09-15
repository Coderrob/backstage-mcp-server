import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types';
import { JsonToTextResponse, ToolErrorHandler } from '../utils';

const paramsSchema = z.object({
  entity: z.any(),
  locationRef: z.string(),
});

@Tool({
  name: ToolName.VALIDATE_ENTITY,
  description: 'Validate an entity structure.',
  paramsSchema,
})
export class ValidateEntityTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.VALIDATE_ENTITY,
      'validateEntity',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const result = await ctx.catalogClient.validateEntity(args.entity, args.locationRef);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
