import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';

const paramsSchema = z.object({
  uid: z.string().uuid(),
});

@Tool({
  name: 'remove_entity_by_uid',
  description: 'Remove an entity by UID.',
  paramsSchema,
})
export class RemoveEntityByUidTool {
  static async execute({ uid }: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    try {
      await context.catalogClient.removeEntityByUid(uid);
      return JsonToTextResponse({ status: ApiStatus.SUCCESS });
    } catch (error) {
      console.error('Error removing entity by UID:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to remove entity by UID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
