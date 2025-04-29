import { z } from 'zod';
import { GetEntityAncestorsRequest } from '@backstage/catalog-client';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.custom<GetEntityAncestorsRequest>();

@Tool({
  name: 'get_entity_ancestors',
  description: 'Get the ancestry tree for an entity.',
  paramsSchema,
})
export class GetEntityAncestorsTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.getEntityAncestors(request);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
