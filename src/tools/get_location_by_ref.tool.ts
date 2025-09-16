import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator.js';
import { ApiStatus } from '../types/apis.js';
import { ToolName } from '../types/constants.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { formatLocation, FormattedTextResponse } from '../utils/formatting/responses.js';
import { ToolErrorHandler } from '../utils/tools/tool-error-handler.js';

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
