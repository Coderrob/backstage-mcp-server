import 'reflect-metadata';

import { z } from 'zod';

import { inputSanitizer } from '../auth/input-sanitizer';
import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { formatEntity, FormattedTextResponse, JsonToTextResponse } from '../utils/responses';

const compoundEntityRefSchema = z.object({
  kind: z.string(),
  namespace: z.string(),
  name: z.string(),
});

const paramsSchema = z.object({
  entityRef: z.union([z.string(), compoundEntityRefSchema]),
});

@Tool({
  name: 'get_entity_by_ref',
  description: 'Get an entity by its UID.',
  paramsSchema,
})
export class GetEntityByRefTool {
  static async execute({ entityRef }: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    try {
      // Sanitize entity reference input
      const sanitizedEntityRef = inputSanitizer.sanitizeEntityRef(entityRef);

      const result = await context.catalogClient.getEntityByRef(sanitizedEntityRef);
      return FormattedTextResponse({ status: ApiStatus.SUCCESS, data: result }, formatEntity);
    } catch (error) {
      console.error('Error getting entity by ref:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to get entity by ref: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
