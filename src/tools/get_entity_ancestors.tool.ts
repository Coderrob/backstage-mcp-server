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
  entityRef: z.union([z.string(), compoundEntityRefSchema]),
});

@Tool({
  name: ToolName.GET_ENTITY_ANCESTORS,
  description: 'Get the ancestry tree for an entity.',
  paramsSchema,
})
export class GetEntityAncestorsTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_ENTITY_ANCESTORS,
      'getEntityAncestors',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const entityRef = isString(args.entityRef) ? args.entityRef : stringifyEntityRef(args.entityRef);
        const result = await ctx.catalogClient.getEntityAncestors({
          entityRef,
        });
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
