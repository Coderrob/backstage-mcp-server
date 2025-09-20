import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { ApiStatus } from '../../types/apis.js';
import { ToolName } from '../../types/constants.js';
import { IToolExecutionContext, IToolRegistrationContext } from '../../types/tools.js';
import { JsonToTextResponse } from '../../utils/formatting/responses.js';
import { CachedExecutionStrategy } from '../../utils/tools/execution-strategies.js';
import { AuthenticationMiddleware, ValidationMiddleware } from '../../utils/tools/middleware.js';
import { ToolFactory } from '../../utils/tools/tool-builder.js';

// Define schemas
const createEntitySchema = z.object({
  kind: z.string().min(1),
  namespace: z.string().min(1),
  name: z.string().min(1),
  spec: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const getEntitySchema = z.object({
  entityRef: z.union([
    z.string(),
    z.object({
      kind: z.string(),
      namespace: z.string(),
      name: z.string(),
    }),
  ]),
  fields: z.array(z.string()).optional(),
});

// Tool class implementations
class CreateEntityToolImpl {
  async execute(params: z.infer<typeof createEntitySchema>, context: IToolExecutionContext): Promise<CallToolResult> {
    const result = await context.catalogClient.addLocation({
      type: params.kind,
      target: `${params.kind}:${params.namespace}/${params.name}`,
    });

    return JsonToTextResponse({
      status: ApiStatus.SUCCESS,
      data: result,
    });
  }
}

class GetEntityToolImpl {
  async execute(params: z.infer<typeof getEntitySchema>, context: IToolExecutionContext): Promise<CallToolResult> {
    const entityRef =
      typeof params.entityRef === 'string'
        ? params.entityRef
        : `${params.entityRef.kind}:${params.entityRef.namespace}/${params.entityRef.name}`;

    const result = await context.catalogClient.getEntityByRef(entityRef);

    return JsonToTextResponse({
      status: ApiStatus.SUCCESS,
      data: result,
    });
  }
}

// Example 1: Using the Builder Pattern with Middleware
export const CreateEntityTool = ToolFactory.createWriteTool()
  .name(ToolName.ADD_LOCATION)
  .description('Create a new entity in the catalog')
  .schema(createEntitySchema)
  .version('2.0.0')
  .tags('entity', 'create')
  .requiresConfirmation(true)
  .use(new AuthenticationMiddleware())
  .use(new ValidationMiddleware())
  .withClass(CreateEntityToolImpl)
  .build();

// Example 2: Using Builder Pattern with Caching Strategy
export const GetEntityTool = ToolFactory.createReadTool()
  .name(ToolName.GET_ENTITY_BY_REF)
  .description('Get a single entity by its reference')
  .schema(getEntitySchema)
  .cacheable(true)
  .use(new ValidationMiddleware())
  .withStrategy(new CachedExecutionStrategy(10 * 60 * 1000)) // 10 minute TTL
  .withClass(GetEntityToolImpl)
  .build();

// Example 3: Plugin-based Tool Registration
export class CatalogToolsPlugin {
  name = 'catalog-tools';
  version = '1.0.0';
  description = 'Enhanced catalog tools with advanced patterns';

  async initialize(_context: IToolRegistrationContext): Promise<void> {
    // In real implementation, you'd register with the actual registrar
    console.warn('Enhanced catalog tools would be registered here');
  }

  async destroy(): Promise<void> {
    console.warn('Enhanced catalog tools unregistered');
  }
}
