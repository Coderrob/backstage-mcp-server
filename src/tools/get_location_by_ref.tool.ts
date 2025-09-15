import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { formatLocation, FormattedTextResponse, JsonToTextResponse } from '../utils/responses';
import { ToolErrorHandler } from '../utils/tool-error-handler';

const paramsSchema = z.object({
  locationRef: z.string(),
});

@Tool({
  name: 'get_location_by_ref',
  description: 'Get location by ref.',
  paramsSchema,
})
export class GetLocationByRefTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    return ToolErrorHandler.executeTool(
      'get_location_by_ref',
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
