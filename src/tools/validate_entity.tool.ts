import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';

const paramsSchema = z.object({
  entity: z.any(),
  locationRef: z.string(),
});

@Tool({
  name: 'validate_entity',
  description: 'Validate an entity structure.',
  paramsSchema,
})
export class ValidateEntityTool {
  static async execute({ entity, locationRef }: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    try {
      const result = await context.catalogClient.validateEntity(entity, locationRef);
      return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
    } catch (error) {
      console.error('Error validating entity:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to validate entity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
