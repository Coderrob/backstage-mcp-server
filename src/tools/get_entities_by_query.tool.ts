import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';

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
    try {
      const result = await context.catalogClient.queryEntities(request);
      return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
    } catch (error) {
      console.error('Error querying entities:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to query entities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
