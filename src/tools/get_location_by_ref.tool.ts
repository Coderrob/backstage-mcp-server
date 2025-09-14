import 'reflect-metadata';

import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { formatLocation, FormattedTextResponse, JsonToTextResponse } from '../utils/responses';

const paramsSchema = z.object({
  locationRef: z.string(),
});

@Tool({
  name: 'get_location_by_ref',
  description: 'Get location by ref.',
  paramsSchema,
})
export class GetLocationByRefTool {
  static async execute({ locationRef }: z.infer<typeof paramsSchema>, context: IToolRegistrationContext) {
    try {
      const result = await context.catalogClient.getLocationByRef(locationRef);
      return FormattedTextResponse({ status: ApiStatus.SUCCESS, data: result }, formatLocation);
    } catch (error) {
      console.error('Error getting location by ref:', error);
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Failed to get location by ref: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    }
  }
}
