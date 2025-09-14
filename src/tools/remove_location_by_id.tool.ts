import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';

const paramsSchema = z.object({
  locationId: z.string(),
});

@Tool({
  name: 'remove_location_by_id',
  description: 'Remove a location from the catalog by id.',
  paramsSchema,
})
export class RemoveLocationByIdTool {
  static async execute({ locationId }: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    try {
      await context.catalogClient.removeLocationById(locationId);
      return JsonToTextResponse({ status: ApiStatus.SUCCESS });
    } catch (error) {
      console.error('Error removing location by ID:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to remove location by ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
