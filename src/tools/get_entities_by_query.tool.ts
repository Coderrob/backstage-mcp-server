import { z } from 'zod';
import { QueryEntitiesRequest } from '@backstage/catalog-client';
import { JsonToTextResponse } from '../utils/responses';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.custom<QueryEntitiesRequest>();

@Tool({
  name: 'get_entities_by_query',
  description: 'Get entities by query filters.',
  paramsSchema,
})
export class GetEntitiesByQueryTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.queryEntities(request);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
