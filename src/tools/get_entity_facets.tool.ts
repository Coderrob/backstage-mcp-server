import { z } from 'zod';
import { GetEntityFacetsRequest } from '@backstage/catalog-client';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.custom<GetEntityFacetsRequest>();

@Tool({
  name: 'get_entity_facets',
  description: 'Get entity facets for a specified field.',
  paramsSchema,
})
export class GetEntityFacetsTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.getEntityFacets(request);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
