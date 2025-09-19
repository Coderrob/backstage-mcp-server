# Advanced MCP Server Patterns

This document demonstrates advanced design patterns implemented in the Backstage MCP Server for enhanced tool templating, type safety, and extensibility.

## 🎯 Implemented Patterns

### 1. Generic Base Classes (`BaseTool<TParams, TResult>`)

**Location:** `src/utils/tools/base-tool.ts`

Provides type-safe tool implementation with automatic schema validation:

```typescript
export abstract class BaseTool<TParams = Record<string, unknown>, TResult = unknown> implements ITool {
  protected abstract readonly paramsSchema: z.ZodSchema<TParams>;
  abstract executeTyped(params: TParams, context: IToolExecutionContext): Promise<TResult>;
  protected abstract formatResult(result: TResult): CallToolResult;
}
```

**Benefits:**
- ✅ Full TypeScript IntelliSense
- ✅ Automatic parameter validation
- ✅ Type-safe result formatting
- ✅ Consistent error handling

### 2. Enhanced Decorator System

**Location:** `src/decorators/enhanced-tool.decorator.ts`

Advanced decorators with automatic categorization and metadata:

```typescript
@ReadTool({
  name: 'get-entity',
  description: 'Retrieve entity data',
  paramsSchema: entitySchema,
  cacheable: true,
  tags: ['entity', 'read']
})
export class GetEntityTool extends BaseTool<EntityParams, Entity> {
  // Fully type-safe implementation
}
```

**Decorator Types:**
- `@ReadTool` - GET operations with caching
- `@WriteTool` - POST/PUT with confirmation
- `@AuthenticatedTool` - Requires authentication
- `@BatchTool` - Batch operations with size limits

### 3. Strategy Pattern for Execution Contexts

**Location:** `src/utils/tools/execution-strategies.ts`

Different execution strategies for various scenarios:

```typescript
// Standard execution
const standardTool = ToolFactory.create()
  .withStrategy(new StandardExecutionStrategy())
  .build();

// Cached execution
const cachedTool = ToolFactory.create()
  .withStrategy(new CachedExecutionStrategy(5 * 60 * 1000)) // 5 min TTL
  .build();

// Batched execution
const batchTool = ToolFactory.create()
  .withStrategy(new BatchedExecutionStrategy())
  .build();
```

### 4. Middleware Pipeline Pattern

**Location:** `src/utils/tools/middleware.ts`

Extensible middleware system for cross-cutting concerns:

```typescript
export const AuthenticatedTool = ToolFactory
  .create()
  .use(new AuthenticationMiddleware())
  .use(new ValidationMiddleware())
  .use(new LoggingMiddleware())
  .build();
```

**Built-in Middleware:**
- `AuthenticationMiddleware` - Handles auth requirements
- `ValidationMiddleware` - Input validation
- `CachingMiddleware` - Response caching

### 5. Builder Pattern for Tool Configuration

**Location:** `src/utils/tools/tool-builder.ts`

Fluent API for tool creation and configuration:

```typescript
export const MyTool = ToolFactory
  .createReadTool()
  .name('my-tool')
  .description('A powerful tool')
  .schema(mySchema)
  .version('1.0.0')
  .tags('category', 'type')
  .cacheable(true)
  .requiresConfirmation(false)
  .use(new ValidationMiddleware())
  .withStrategy(new CachedExecutionStrategy())
  .withClass(MyToolImplementation)
  .build();
```

### 6. Plugin Architecture

**Location:** `src/utils/plugins/plugin-manager.ts`

Extensible plugin system for server enhancements:

```typescript
export class MyPlugin implements IMcpPlugin {
  name = 'my-plugin';
  version = '1.0.0';

  async initialize(context: IToolRegistrationContext): Promise<void> {
    // Register tools, add middleware, etc.
  }

  async destroy(): Promise<void> {
    // Cleanup resources
  }
}
```

## 🚀 Usage Examples

### Basic Tool with Type Safety

```typescript
import { BaseTool } from '../utils/tools/base-tool.js';
import { ReadTool } from '../decorators/enhanced-tool.decorator.js';

const paramsSchema = z.object({
  entityRef: z.string(),
  fields: z.array(z.string()).optional(),
});

@ReadTool({
  name: 'get-entity',
  description: 'Get entity by reference',
  paramsSchema,
  cacheable: true,
})
export class GetEntityTool extends BaseTool<z.infer<typeof paramsSchema>, Entity> {
  protected readonly paramsSchema = paramsSchema;

  async executeTyped(params: z.infer<typeof paramsSchema>, context: IToolExecutionContext): Promise<Entity> {
    // params.entityRef is fully typed - IntelliSense works!
    return await context.catalogClient.getEntityByRef(params.entityRef);
  }

  protected formatResult(result: Entity): CallToolResult {
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
  }
}
```

### Advanced Tool with Middleware and Strategy

```typescript
export const AdvancedTool = ToolFactory
  .createWriteTool()
  .name('advanced-tool')
  .description('Advanced tool with full feature set')
  .schema(advancedSchema)
  .requiresConfirmation(true)
  .requiresScopes('write', 'admin')
  .use(new AuthenticationMiddleware())
  .use(new ValidationMiddleware())
  .use(new AuditMiddleware())
  .withStrategy(new CachedExecutionStrategy(10 * 60 * 1000))
  .withClass(AdvancedToolImpl)
  .build();
```

### Plugin-Based Extensions

```typescript
export class MetricsPlugin implements IMcpPlugin {
  name = 'metrics-plugin';
  version = '1.0.0';

  async initialize(context: IToolRegistrationContext): Promise<void> {
    // Add metrics middleware to all tools
    context.toolRegistrar.register(
      ToolFactory.create()
        .use(new MetricsMiddleware())
        .build()
    );
  }
}
```

## 📊 Benefits Achieved

| Pattern | Benefit | Implementation |
|---------|---------|----------------|
| **Generics** | Type safety, IntelliSense | `BaseTool<TParams, TResult>` |
| **Decorators** | Metadata, categorization | `@ReadTool`, `@WriteTool` |
| **Strategy** | Execution flexibility | `CachedExecutionStrategy` |
| **Middleware** | Cross-cutting concerns | Pipeline architecture |
| **Builder** | Fluent configuration | `ToolFactory.create()` |
| **Plugin** | Extensibility | `PluginManager` |

## 🔄 Migration Guide

### From Legacy Tools

```typescript
// Before (Legacy)
export class LegacyTool {
  static async execute(request, context) {
    // Manual validation, no type safety
    return result;
  }
}

// After (Modern)
@ReadTool({
  name: 'legacy-tool',
  description: 'Modernized legacy tool',
  paramsSchema: legacySchema,
})
export class ModernTool extends BaseTool<LegacyParams, LegacyResult> {
  // Full type safety, automatic validation
}
```

### Using Migration Helper

```typescript
import { ToolMigrationHelper } from './utils/tools/migration-helper.js';

const modernTool = ToolMigrationHelper.migrateLegacyTool(
  LegacyTool,
  legacyMetadata,
  { addCaching: true, addValidation: true }
);
```

## 🎯 Best Practices

1. **Use BaseTool for new implementations** - Provides type safety and consistency
2. **Leverage decorators** - Automatic categorization and metadata
3. **Apply middleware strategically** - Authentication, validation, caching
4. **Choose execution strategies** - Standard, cached, or batched based on needs
5. **Use builder pattern** - Fluent, readable tool configuration
6. **Create plugins for extensions** - Keep core server clean and extensible

## 🔧 Configuration

### Environment Variables

```bash
# Enable advanced patterns
ENABLE_ADVANCED_PATTERNS=true

# Cache settings
TOOL_CACHE_TTL=300000
TOOL_CACHE_MAX_SIZE=1000

# Plugin settings
PLUGIN_PATH=./plugins
ENABLE_PLUGIN_AUTO_LOAD=true
```

### Server Configuration

```typescript
const server = new McpServer({
  // ... server config
});

// Register advanced patterns
const pluginManager = new PluginManager();
pluginManager.register(new MetricsPlugin());
pluginManager.register(new SecurityPlugin());

// Use advanced tool factory
const advancedTool = ToolFactory.createReadTool()
  .withStrategy(new CachedExecutionStrategy())
  .build();
```

This implementation provides a solid foundation for scalable, maintainable, and extensible MCP server development with modern TypeScript patterns.