import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators/index.js';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types/index.js';
import { formatLocation, FormattedTextResponse, ToolErrorHandler } from '../utils/index.js';

const paramsSchema = z.object({
  locationRef: z.string(),
});

@Tool({
  name: ToolName.GET_LOCATION_BY_REF,
  description: 'Get location by ref.',
  paramsSchema,
})
export class GetLocationByRefTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_LOCATION_BY_REF,
      'getLocationByRef',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const result = await ctx.catalogClient.getLocationByRef(args.locationRef);
        return FormattedTextResponse({ status: ApiStatus.SUCCESS, data: result }, formatLocation);
      },
      request,
      context,
      true
    );
  }
}
