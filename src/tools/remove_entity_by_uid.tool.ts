import { z } from 'zod';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.object({
  uid: z.string().uuid(),
});

@Tool({
  name: 'remove_entity_by_uid',
  description: 'Remove an entity by UID.',
  paramsSchema,
})
export class RemoveEntityByUidTool {
  static async execute(
    { uid }: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    await context.catalogClient.removeEntityByUid(uid);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS });
  }
}
