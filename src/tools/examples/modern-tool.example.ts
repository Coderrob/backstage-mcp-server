import { Entity } from '@backstage/catalog-model';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { ReadTool } from '../../decorators/enhanced-tool.decorator.js';
import { ApiStatus } from '../../types/apis.js';
import { ToolName } from '../../types/constants.js';
import { IToolExecutionContext } from '../../types/tools.js';
import { JsonToTextResponse } from '../../utils/formatting/responses.js';
import { BaseTool } from '../../utils/tools/base-tool.js';

// Define the parameters schema with full type safety
const getEntityParamsSchema = z.object({
  entityRef: z.union([
    z.string(),
    z.object({
      kind: z.string(),
      namespace: z.string(),
      name: z.string(),
    }),
  ]),
});

/**
 * Example of a modern, type-safe tool using generics and enhanced decorators
 * This demonstrates the recommended patterns for new tool development
 */
@ReadTool({
  name: ToolName.GET_ENTITY_BY_REF,
  description: 'Get a single entity by its reference (namespace/name or compound ref).',
  paramsSchema: getEntityParamsSchema,
  cacheable: true,
  tags: ['entity', 'read'],
})
export class ModernGetEntityByRefTool extends BaseTool<z.infer<typeof getEntityParamsSchema>, Entity | undefined> {
  protected readonly metadata = {
    name: ToolName.GET_ENTITY_BY_REF,
    description: 'Get a single entity by its reference (namespace/name or compound ref).',
    paramsSchema: getEntityParamsSchema,
    category: 'read',
    tags: ['entity', 'read'],
    cacheable: true,
  };

  protected readonly paramsSchema = getEntityParamsSchema;

  /**
   * Type-safe execution method with full IntelliSense support
   */
  async executeTyped(
    params: z.infer<typeof getEntityParamsSchema>,
    context: IToolExecutionContext
  ): Promise<Entity | undefined> {
    // Full type safety - params.entityRef is properly typed
    const entityRef = params.entityRef;

    // Context provides type-safe access to catalog client
    return await context.catalogClient.getEntityByRef(entityRef);
  }

  /**
   * Format the result for MCP response
   */
  protected formatResult(result: Entity | undefined): CallToolResult {
    return JsonToTextResponse({
      status: ApiStatus.SUCCESS,
      data: result,
    });
  }
}
