import { z } from 'zod';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.object({
  entityRef: z.string(),
});

@Tool({
  name: 'refresh_entity',
  description: 'Trigger a refresh of an entity.',
  paramsSchema,
})
export class RefreshEntityTool {
  static async execute(
    { entityRef }: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    await context.catalogClient.refreshEntity(entityRef);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS });
  }
}
