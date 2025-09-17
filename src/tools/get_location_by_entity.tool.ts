import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator.js';
import { ApiStatus } from '../types/apis.js';
import { ToolName } from '../types/constants.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { isString } from '../utils/core/guards.js';
import { EntityRef } from '../utils/formatting/entity-ref.js';
import { JsonToTextResponse } from '../utils/formatting/responses.js';
import { ToolErrorHandler } from '../utils/tools/tool-error-handler.js';

const paramsSchema = z.object({
  entityRef: z.string(),
});

@Tool({
  name: ToolName.GET_LOCATION_BY_ENTITY,
  description: 'Get the location associated with an entity.',
  paramsSchema,
})
export class GetLocationByEntityTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_LOCATION_BY_ENTITY,
      'getLocationByEntity',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const ref = isString(args.entityRef) ? args.entityRef : EntityRef.toString(args.entityRef);
        const result = await ctx.catalogClient.getLocationByEntity(ref);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
