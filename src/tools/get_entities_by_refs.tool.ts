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
  entityRefs: z.array(z.union([z.string(), compoundEntityRefSchema])),
});

@Tool({
  name: 'get_entities_by_refs',
  description: 'Get multiple entities by their refs.',
  paramsSchema,
})
export class GetEntitiesByRefsTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    try {
      const entityRefs = request.entityRefs.map((ref) => (typeof ref === 'string' ? ref : stringifyEntityRef(ref)));
      const result = await context.catalogClient.getEntitiesByRefs({
        entityRefs,
      });
      return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
    } catch (error) {
      console.error('Error getting entities by refs:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to get entities by refs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
