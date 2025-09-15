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

const entityOrderSchema = z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']).optional(),
});

const paramsSchema = z.object({
  filter: z.array(entityFilterSchema).optional(),
  fields: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  order: entityOrderSchema.optional(),
});

@Tool({
  name: 'get_entities_by_query',
  description: 'Get entities by query filters.',
  paramsSchema,
})
export class GetEntitiesByQueryTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    return ToolErrorHandler.executeTool(
      'get_entities_by_query',
      'queryEntities',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const result = await ctx.catalogClient.queryEntities(args);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
