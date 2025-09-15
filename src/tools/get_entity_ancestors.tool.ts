import 'reflect-metadata';

import { stringifyEntityRef } from '@backstage/catalog-model';
import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { ToolErrorHandler } from '../utils/tool-error-handler';

const compoundEntityRefSchema = z.object({
  kind: z.string(),
  namespace: z.string(),
  name: z.string(),
});

const paramsSchema = z.object({
  entityRef: z.union([z.string(), compoundEntityRefSchema]),
});

@Tool({
  name: 'get_entity_ancestors',
  description: 'Get the ancestry tree for an entity.',
  paramsSchema,
})
export class GetEntityAncestorsTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    return ToolErrorHandler.executeTool(
      'get_entity_ancestors',
      'getEntityAncestors',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const entityRef = typeof args.entityRef === 'string' ? args.entityRef : stringifyEntityRef(args.entityRef);
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
