import { z } from 'zod';
import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';

const paramsSchema = z.object({
  locationRef: z.string(),
});

@Tool({
  name: 'get_location_by_ref',
  description: 'Get location by ref.',
  paramsSchema,
})
export class GetLocationByRefTool {
  static async execute(
    { locationRef }: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.getLocationByRef(locationRef);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
