import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types';
import { JsonToTextResponse, ToolErrorHandler } from '../utils';

const entityFilterSchema = z.object({
  key: z.string(),
  values: z.array(z.string()),
});

const entityOrderSchema = z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']).optional(),
});

const paramsSchema = z.object({
  filter: z.array(entityFilterSchema).optional(),
  fields: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  order: entityOrderSchema.optional(),
});

@Tool({
  name: ToolName.GET_ENTITIES_BY_QUERY,
  description: 'Get entities by query filters.',
  paramsSchema,
})
export class GetEntitiesByQueryTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_ENTITIES_BY_QUERY,
      'queryEntities',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const result = await ctx.catalogClient.queryEntities(args);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
