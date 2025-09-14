import 'reflect-metadata';

import { stringifyEntityRef } from '@backstage/catalog-model';
import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';

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
  static async execute({ entityRef }: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    try {
      const ref = typeof entityRef === 'string' ? entityRef : stringifyEntityRef(entityRef);
      const result = await context.catalogClient.getLocationByEntity(ref);
      return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
    } catch (error) {
      console.error('Error getting location by entity:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to get location by entity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
