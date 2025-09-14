import 'reflect-metadata';

import { z } from 'zod';

import { BackstageCatalogApi } from '../api/backstage-catalog-api';
import { inputSanitizer } from '../auth/input-sanitizer';
import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { formatEntityList, FormattedTextResponse, JsonToTextResponse } from '../utils/responses';
import { logger } from '../utils';

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
  name: 'get_entities',
  description: 'Get all entities in the catalog. Supports pagination and JSON:API formatting for enhanced LLM context.',
  paramsSchema,
})
export class GetEntitiesTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    logger.debug('Executing get_entities tool', { request });
    try {
      // Sanitize and validate inputs
      const sanitizedRequest = {
        filter: request.filter ? inputSanitizer.sanitizeFilter(request.filter) : undefined,
        fields: request.fields
          ? inputSanitizer.sanitizeArray(request.fields, 'fields', (field) =>
              inputSanitizer.sanitizeString(field, 'field')
            )
          : undefined,
        limit: request.limit,
        offset: request.offset,
      };

      const result = await context.catalogClient.getEntities(sanitizedRequest);

      if (request.format === 'jsonapi') {
        const jsonApiResult = await (context.catalogClient as BackstageCatalogApi).getEntitiesJsonApi(sanitizedRequest);
        const count = Array.isArray(jsonApiResult.data) ? jsonApiResult.data.length : jsonApiResult.data ? 1 : 0;
        logger.debug('Returning JSON:API formatted entities', { count });
        return JsonToTextResponse({
          status: ApiStatus.SUCCESS,
          data: jsonApiResult,
        });
      }

      logger.debug('Returning standard formatted entities', { count: result.items?.length || 0 });
      return FormattedTextResponse({ status: ApiStatus.SUCCESS, data: result }, formatEntityList);
    } catch (error) {
      logger.error('Error getting entities', { error: error instanceof Error ? error.message : String(error) });
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to get entities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
