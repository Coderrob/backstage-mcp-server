import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';

const paramsSchema = z.object({
  entityRef: z.string(),
});

@Tool({
  name: 'refresh_entity',
  description: 'Trigger a refresh of an entity.',
  paramsSchema,
})
export class RefreshEntityTool {
  static async execute({ entityRef }: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    try {
      await context.catalogClient.refreshEntity(entityRef);
      return JsonToTextResponse({ status: ApiStatus.SUCCESS });
    } catch (error) {
      console.error('Error refreshing entity:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to refresh entity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
