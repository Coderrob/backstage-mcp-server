import { z } from 'zod';
import { GetEntitiesRequest } from '@backstage/catalog-client';
import { JsonToTextResponse } from '../utils/responses';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.custom<GetEntitiesRequest>();

@Tool({
  name: 'get_entities',
  description: 'Get all entities in the catalog.',
  paramsSchema,
})
export class GetEntitiesTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.getEntities(request);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
