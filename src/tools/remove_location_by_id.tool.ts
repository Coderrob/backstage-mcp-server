import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types';
import { JsonToTextResponse, ToolErrorHandler } from '../utils';

const paramsSchema = z.object({
  locationId: z.string(),
});

@Tool({
  name: ToolName.REMOVE_LOCATION_BY_ID,
  description: 'Remove a location from the catalog by id.',
  paramsSchema,
})
export class RemoveLocationByIdTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.REMOVE_LOCATION_BY_ID,
      'removeLocationById',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        await ctx.catalogClient.removeLocationById(args.locationId);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS });
      },
      request,
      context,
      true
    );
  }
}
