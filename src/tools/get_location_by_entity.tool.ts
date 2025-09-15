import 'reflect-metadata';

import { stringifyEntityRef } from '@backstage/catalog-model';
import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { ToolErrorHandler } from '../utils/tool-error-handler';

const compoundEntityRefSchema = z.object({
  kind: z.string(),
  namespace: z.string(),
  name: z.string(),
});

const paramsSchema = z.object({
  entityRef: z.union([z.string(), compoundEntityRefSchema]),
});

@Tool({
  name: 'get_location_by_entity',
  description: 'Get the location associated with an entity.',
  paramsSchema,
})
export class GetLocationByEntityTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    return ToolErrorHandler.executeTool(
      'get_location_by_entity',
      'getLocationByEntity',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const ref = typeof args.entityRef === 'string' ? args.entityRef : stringifyEntityRef(args.entityRef);
        const result = await ctx.catalogClient.getLocationByEntity(ref);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
