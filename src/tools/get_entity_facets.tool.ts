import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator.js';
import { ApiStatus } from '../types/apis.js';
import { ToolName } from '../types/constants.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { JsonToTextResponse } from '../utils/formatting/responses.js';
import { ToolErrorHandler } from '../utils/tools/tool-error-handler.js';

const entityFilterSchema = z.object({
  key: z.string(),
  values: z.array(z.string()),
});

const paramsSchema = z.object({
  filter: z.array(entityFilterSchema).optional(),
  facets: z.array(z.string()),
});

@Tool({
  name: ToolName.GET_ENTITY_FACETS,
  description: 'Get entity facets for a specified field.',
  paramsSchema,
})
export class GetEntityFacetsTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_ENTITY_FACETS,
      'getEntityFacets',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const result = await ctx.catalogClient.getEntityFacets(args);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
