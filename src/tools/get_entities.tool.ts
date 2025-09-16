import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { BackstageCatalogApi } from '../api/index.js';
import { inputSanitizer } from '../auth/index.js';
import { Tool } from '../decorators/index.js';
import { ApiStatus, IToolRegistrationContext, ToolName } from '../types/index.js';
import {
  formatEntityList,
  FormattedTextResponse,
  JsonToTextResponse,
  logger,
  ToolErrorHandler,
} from '../utils/index.js';

const entityFilterSchema = z.object({
  key: z.string(),
  values: z.array(z.string()),
});

const paramsSchema = z.object({
  filter: z.array(entityFilterSchema).optional(),
  fields: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  format: z.enum(['standard', 'jsonapi']).optional().default('standard'),
});

@Tool({
  name: ToolName.GET_ENTITIES,
  description: 'Get all entities in the catalog. Supports pagination and JSON:API formatting for enhanced LLM context.',
  paramsSchema,
})
export class GetEntitiesTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_ENTITIES,
      'get_entities',
      async (req: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        logger.debug('Executing get_entities tool', { request: req });

        // Sanitize and validate inputs
        const sanitizedRequest = {
          filter: req.filter ? inputSanitizer.sanitizeFilter(req.filter) : undefined,
          fields: req.fields
            ? inputSanitizer.sanitizeArray(req.fields, 'fields', (field) =>
                inputSanitizer.sanitizeString(field, 'field')
              )
            : undefined,
          limit: req.limit,
          offset: req.offset,
        };

        const result = await ctx.catalogClient.getEntities(sanitizedRequest);

        if (req.format === 'jsonapi') {
          const jsonApiResult = await (ctx.catalogClient as BackstageCatalogApi).getEntitiesJsonApi(sanitizedRequest);
          const count = Array.isArray(jsonApiResult.data) ? jsonApiResult.data.length : jsonApiResult.data ? 1 : 0;
          logger.debug('Returning JSON:API formatted entities', { count });
          return JsonToTextResponse({
            status: ApiStatus.SUCCESS,
            data: jsonApiResult,
          });
        }

        logger.debug('Returning standard formatted entities', { count: result.items?.length || 0 });
        return FormattedTextResponse({ status: ApiStatus.SUCCESS, data: result }, formatEntityList);
      },
      request,
      context,
      false // Use simple error format for now
    );
  }
}
