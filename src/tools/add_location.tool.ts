import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';

const paramsSchema = z.object({
  type: z.string(),
  target: z.string(),
});

@Tool({
  name: 'add_location',
  description: 'Create a new location in the catalog.',
  paramsSchema: paramsSchema,
})
export class AddLocationTool {
  static async execute(request: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    try {
      const result = await context.catalogClient.addLocation(request);
      return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
    } catch (error) {
      console.error('Error adding location:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to add location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
