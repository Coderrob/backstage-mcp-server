import 'reflect-metadata';

import { stringifyEntityRef } from '@backstage/catalog-model';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types';
import { isString, JsonToTextResponse, ToolErrorHandler } from '../utils';

const compoundEntityRefSchema = z.object({
  kind: z.string(),
  namespace: z.string(),
  name: z.string(),
});

const paramsSchema = z.object({
  entityRef: z.union([z.string(), compoundEntityRefSchema]),
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
        const ref = isString(args.entityRef) ? args.entityRef : stringifyEntityRef(args.entityRef);
        const result = await ctx.catalogClient.getLocationByEntity(ref);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
