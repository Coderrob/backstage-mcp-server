import { z } from 'zod';

import { ApiStatus, IToolRegistrationContext } from '../types';
import { JsonToTextResponse } from '../utils/responses';
import { Tool } from '../decorators/tool.decorator';
import { AddLocationRequest } from '@backstage/catalog-client';

const paramsSchema = z.custom<AddLocationRequest>();

@Tool({
  name: 'add_location',
  description: 'Create a new location in the catalog.',
  paramsSchema: paramsSchema,
})
export class AddLocationTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ) {
    const result = await context.catalogClient.addLocation(request);
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
