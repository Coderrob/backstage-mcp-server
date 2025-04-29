import { z } from 'zod';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.object({
  locationId: z.string(),
});

@Tool({
  name: 'remove_location_by_id',
  description: 'Remove a location from the catalog by id.',
  paramsSchema,
})
export class RemoveLocationByIdTool {
  static async execute(
    { locationId }: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    await context.catalogClient.removeLocationById(locationId);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS });
  }
}
