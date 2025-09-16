import 'reflect-metadata';

import { stringifyEntityRef } from '@backstage/catalog-model';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators/index.js';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types/index.js';
import { isString, JsonToTextResponse, ToolErrorHandler } from '../utils/index.js';

const compoundEntityRefSchema = z.object({
  kind: z.string(),
  namespace: z.string(),
  name: z.string(),
});

const paramsSchema = z.object({
  entityRefs: z.array(z.union([z.string(), compoundEntityRefSchema])),
});

@Tool({
  name: ToolName.GET_ENTITIES_BY_REFS,
  description: 'Get multiple entities by their refs.',
  paramsSchema,
})
export class GetEntitiesByRefsTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_ENTITIES_BY_REFS,
      'getEntitiesByRefs',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const entityRefs = args.entityRefs.map((ref) => (isString(ref) ? ref : stringifyEntityRef(ref)));
        const result = await ctx.catalogClient.getEntitiesByRefs({
          entityRefs,
        });
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
