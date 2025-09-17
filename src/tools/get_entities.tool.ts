import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { BackstageCatalogApi } from '../api/backstage-catalog-api.js';
import { inputSanitizer } from '../auth/input-sanitizer.js';
import { Tool } from '../decorators/tool.decorator.js';
import { ApiStatus } from '../types/apis.js';
import { ToolName } from '../types/constants.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { logger } from '../utils/core/logger.js';
import { formatEntityList, FormattedTextResponse, JsonToTextResponse } from '../utils/formatting/responses.js';
import { ToolErrorHandler } from '../utils/tools/tool-error-handler.js';

const entityFilterSchema = z.object({
  key: z.string(),
  values: z.array(z.string()),
});

const paramsSchema = z.object({
  filter: z.array(entityFilterSchema).optional(),
  fields: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  format: z.enum(['standard', 'jsonapi']).optional().default('jsonapi'),
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
          format: req.format,
        };

        if (req.format === 'jsonapi') {
          const jsonApiResult = await (ctx.catalogClient as BackstageCatalogApi).getEntitiesJsonApi(sanitizedRequest);
          const count = Array.isArray(jsonApiResult.data) ? jsonApiResult.data.length : jsonApiResult.data ? 1 : 0;
          logger.debug('Returning JSON:API formatted entities', { count });
          return JsonToTextResponse({
            status: ApiStatus.SUCCESS,
            data: jsonApiResult,
          });
        } else if (req.format === 'standard') {
          // Use the old formatted text response for 'standard' format
          const result = await ctx.catalogClient.getEntities(sanitizedRequest);
          logger.debug('Returning standard formatted entities', { count: result.items?.length || 0 });
          return FormattedTextResponse({ status: ApiStatus.SUCCESS, data: result.items }, formatEntityList);
        } else {
          // Default to JSON format for better LLM access
          const result = await ctx.catalogClient.getEntities(sanitizedRequest);
          logger.debug('Returning JSON formatted entities', { count: result.items?.length || 0 });
          return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
        }
      },
      request,
      context,
      false // Use simple error format for now
    );
  }
}
