import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators/index.js';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types/index.js';
import { JsonToTextResponse, ToolErrorHandler } from '../utils/index.js';

const paramsSchema = z.object({
  type: z.string(),
  target: z.string(),
});

@Tool({
  name: ToolName.ADD_LOCATION,
  description: 'Create a new location in the catalog.',
  paramsSchema: paramsSchema,
})
export class AddLocationTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.ADD_LOCATION,
      'addLocation',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const result = await ctx.catalogClient.addLocation(args);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
