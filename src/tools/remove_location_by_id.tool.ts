import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { ToolErrorHandler } from '../utils/tool-error-handler';

const paramsSchema = z.object({
  locationId: z.string(),
});

@Tool({
  name: 'remove_location_by_id',
  description: 'Remove a location from the catalog by id.',
  paramsSchema,
})
export class RemoveLocationByIdTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    return ToolErrorHandler.executeTool(
      'remove_location_by_id',
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
