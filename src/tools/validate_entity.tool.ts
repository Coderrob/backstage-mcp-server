import { z } from 'zod';
import { Entity } from '@backstage/catalog-model';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.object({
  entity: z.custom<Entity>(),
  locationRef: z.string(),
});

@Tool({
  name: 'validate_entity',
  description: 'Validate an entity structure.',
  paramsSchema,
})
export class ValidateEntityTool {
  static async execute(
    { entity, locationRef }: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.validateEntity(
      entity,
      locationRef
    );
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
