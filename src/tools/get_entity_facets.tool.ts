import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';

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
    try {
      const result = await context.catalogClient.getEntityFacets(request);
      return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
    } catch (error) {
      console.error('Error getting entity facets:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to get entity facets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
