import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { inputSanitizer } from '../auth/input-sanitizer.js';
import { Tool } from '../decorators/index.js';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types/index.js';
import { formatEntity, FormattedTextResponse } from '../utils/formatting/responses.js';
import { ToolErrorHandler } from '../utils/tools/tool-error-handler.js';

const compoundEntityRefSchema = z.object({
  kind: z.string(),
  namespace: z.string(),
  name: z.string(),
});

const paramsSchema = z.object({
  entityRef: z.union([z.string(), compoundEntityRefSchema]),
});

@Tool({
  name: ToolName.GET_ENTITY_BY_REF,
  description: 'Get a single entity by its reference (namespace/name or compound ref).',
  paramsSchema,
})
export class GetEntityByRefTool {
  static async execute(
    { entityRef }: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_ENTITY_BY_REF,
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
