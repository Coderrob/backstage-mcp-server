# Adding a Backstage MCP tool

This guide is the contribution path for adding or changing the Catalog tool surface. The directory-specific rules in [`src/backstage/tools/AGENTS.md`](../../src/backstage/tools/AGENTS.md) are authoritative for files in that folder.

The generic definition, registration, middleware, and result lifecycle is documented by the [`@coderrob/mcp-kernel` architecture guide](https://github.com/Coderrob/mcp-kernel/blob/main/docs/architecture.md). This guide covers the Backstage-specific authoring steps.

## Before you start

Decide whether the capability belongs in the Backstage plugin or the generic harness:

- Reusable Catalog Zod schemas belong in `src/shared/schema.ts`; tool-specific schemas can stay beside their handlers under `src/backstage/tools`.
- Reusable MCP lifecycle or protocol behavior belongs in `@coderrob/mcp-kernel`; release it from the kernel repository before updating this package's dependency.
- Catalog handlers, annotations, policies, and error mapping belong under `src/backstage/tools`.
- Cross-cutting constants and enums belong under `src/shared/constants`. Use `BackstageEntityKind` for fixed standard-kind filters, while allowing custom kinds in generic inputs.
- Reusable type-only contracts belong under `src/types`.

Use the official `IBackstageCatalogApi` contract through `BackstageMcpContext`. Do not call Catalog HTTP endpoints directly from a tool.

## 1. Declare the stable name

Add the snake-case protocol identifier to `BackstageToolName` in [`src/shared/constants/backstage-catalog.ts`](../../src/shared/constants/backstage-catalog.ts). Refer to the enum member from the tool definition and tests so the identifier has one source of truth.

## 2. Define one tool per module

Create `<tool_name>.tool.ts` beside the other tools. This existing read-only definition shows the expected shape:

```typescript
export const getEntitiesTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITIES,
  title: 'Get catalog entities',
  description: 'Query Catalog entities with filtering and pagination.',
  inputSchema: queryEntitiesInputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Queries Catalog entities with validated input.
   * @param invocation - Validated input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.queryEntities(toQueryEntitiesRequest(input)),
      'Backstage could not return catalog entities'
    );
  },
});
```

The Zod schema is both runtime validation and the source of the handler's input type. Do not add a parallel handwritten input interface or cast the parsed value. Give every Zod object and every named property a meaningful `.describe()` so generated MCP tool metadata explains the expected inputs and outputs.

## 3. Choose honest annotations and policies

Reuse the shared presets in [`shared.ts`](../../src/backstage/tools/shared.ts) where their semantics match:

| Operation                          | Annotations              | Policy                   | Required behavior                                                  |
| ---------------------------------- | ------------------------ | ------------------------ | ------------------------------------------------------------------ |
| Cacheable read                     | `readAnnotations`        | `catalogReadPolicy`      | Must remain side-effect free; cache varies by principal by default |
| Non-cacheable lookup or validation | `readAnnotations`        | `catalogOperationPolicy` | Uses the shared timeout without caching                            |
| Mutation                           | `writeAnnotations`       | `catalogWritePolicy`     | Rate limited and invalidates the `catalog` cache tag               |
| Destructive mutation               | `destructiveAnnotations` | `catalogWritePolicy`     | Must accurately advertise destructive behavior and invalidation    |

Cached tools must declare `readOnlyHint: true`; registry construction rejects unsafe cache declarations. Use `catalogResult` or `catalogOptionalResult` so official-client failures become stable MCP errors.

## 4. Register the definition

Import the new definition in [`src/backstage/tools/index.ts`](../../src/backstage/tools/index.ts) and add it to `backstageCatalogTools` in deterministic alphabetical order by MCP name. No other mutable registration step exists: `backstage.plugin.ts` composes this array into the plugin.

## 5. Add the colocated test

Create `<tool_name>.tool.test.ts` beside the module. Cover:

- stable name, title, description, annotations, and policy;
- accepted and rejected schema inputs;
- meaningful argument forwarding to the typed Catalog fake;
- structured success output; and
- relevant not-found or upstream failure behavior.

Every behavioral TypeScript file must have a side-by-side test, and every production file must independently remain above 95% statements, branches, functions, and lines. Type-only modules under `src/types` are exempt because they emit no behavior.

## 6. Update the public surface

A tool change affects more than its module:

1. Update plugin contract expectations and the deterministic smoke-test fixture.
2. Update the [Backstage tool mapping](../integrations/backstage-catalog.md#mcp-to-catalog-mapping).
3. Build and regenerate `tools-manifest.json` from the same definitions used at runtime.
4. Review client-facing configuration or examples when inputs or safety annotations change.

```bash
corepack yarn build
corepack yarn manifest:generate
corepack yarn manifest:check
```

Commit the generated manifest only when the definition change is intentional.

## 7. Run the change-specific gate

```bash
corepack yarn lint
corepack yarn typecheck
corepack yarn architecture:check
corepack yarn knip
corepack yarn test
corepack yarn test:mcp
corepack yarn manifest:check
```

`test:mcp` proves discovery and invocation through the packaged stdio server. It includes contract tests, a build, the SDK CLI smoke test, all 13 tool calls against a deterministic Catalog stub, and the independent MCP Inspector check.

## Definition checklist

- [ ] Stable name comes from `BackstageToolName`.
- [ ] Input and structured output are expressed with Zod.
- [ ] Annotations accurately communicate read-only, idempotent, open-world, and destructive behavior.
- [ ] Policy matches the operation's caching, invalidation, rate-limit, and timeout needs.
- [ ] Handler uses `BackstageMcpContext.catalogClient`, shared reference conversion, and shared error mapping.
- [ ] Every function and callback required by lint has JSDoc.
- [ ] The colocated test covers metadata, validation, behavior, and failures.
- [ ] Tool index, contract fixtures, manifest, and user documentation agree.
