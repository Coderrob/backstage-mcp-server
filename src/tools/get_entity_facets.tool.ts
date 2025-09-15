import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { ToolErrorHandler } from '../utils/tool-error-handler';

const entityFilterSchema = z.object({
  key: z.string(),
  values: z.array(z.string()),
});

const paramsSchema = z.object({
  filter: z.array(entityFilterSchema).optional(),
  facets: z.array(z.string()),
});

@Tool({
  name: 'get_entity_facets',
  description: 'Get entity facets for a specified field.',
  paramsSchema,
})
export class GetEntityFacetsTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    return ToolErrorHandler.executeTool(
      'get_entity_facets',
      'getEntityFacets',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const result = await ctx.catalogClient.getEntityFacets(args);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
