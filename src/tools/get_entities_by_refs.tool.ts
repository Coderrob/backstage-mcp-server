import { z } from 'zod';
import { GetEntitiesByRefsRequest } from '@backstage/catalog-client';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.custom<GetEntitiesByRefsRequest>();

@Tool({
  name: 'get_entities_by_refs',
  description: 'Get multiple entities by their refs.',
  paramsSchema,
})
export class GetEntitiesByRefsTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.getEntitiesByRefs(request);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
