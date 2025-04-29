import { z } from 'zod';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.object({
  entityRef: z.union([z.string(), z.custom<CompoundEntityRef>()]),
});

@Tool({
  name: 'get_entity_by_ref',
  description: 'Get an entity by its UID.',
  paramsSchema,
})
export class GetEntityByRefTool {
  static async execute(
    { entityRef }: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.getEntityByRef(entityRef);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
