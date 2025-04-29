import { z } from 'zod';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.object({
  entityRef: z.union([z.string(), z.custom<CompoundEntityRef>()]),
});

@Tool({
  name: 'get_location_by_entity',
  description: 'Get the location associated with an entity.',
  paramsSchema,
})
export class GetLocationByEntityTool {
  static async execute(
    { entityRef }: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.getLocationByEntity(entityRef);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
