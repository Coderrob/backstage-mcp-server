import 'reflect-metadata';

import { z } from 'zod';

import { inputSanitizer } from '../auth/input-sanitizer';
import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { formatEntity, FormattedTextResponse, ToolErrorHandler } from '../utils';

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
  description: 'Get a single entity by its reference (namespace/name or compound ref).',
  paramsSchema,
})
export class GetEntityByRefTool {
  static async execute({ entityRef }: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    return ToolErrorHandler.executeTool(
      'get_entity_by_ref',
      'get_entity_by_ref',
      async ({ entityRef: ref }: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        // Sanitize entity reference input
        const sanitizedEntityRef = inputSanitizer.sanitizeEntityRef(ref);

        const result = await ctx.catalogClient.getEntityByRef(sanitizedEntityRef);
        return FormattedTextResponse({ status: ApiStatus.SUCCESS, data: result }, formatEntity);
      },
      { entityRef },
      context,
      true // Use JSON:API error format
    );
  }
}
