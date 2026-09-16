# MCP Architecture and Implementation Analysis

> Baseline note: this analysis captures the repository state before the generic harness implementation. See the [MCP update plan](../plans/mcp-update.md) for the delivered architecture and remaining migration boundary.

## Scope and snapshot

This document analyzes the MCP-related code in the current working tree. The repository is in the middle of a broad source-tree flattening: many files have been moved, several tests have been removed, and both staged and unstaged edits are present. The analysis therefore separates the runtime path that is currently intended to be active from parallel or incomplete implementations that remain in the tree.

The server is a TypeScript/Node.js package built around `@modelcontextprotocol/sdk` 1.18.1, Zod 3, and the Backstage Catalog API. It currently exposes an stdio MCP process and also attempts to provide reusable library output in ESM, CommonJS, and declaration formats.

## Executive summary

The repository contains useful ingredients for an MCP application framework: declarative metadata, Zod schemas, a fluent tool builder, execution middleware, strategy objects, plugin lifecycle hooks, a tool registry, response helpers, health checks, and a replaceable HTTP client. The Backstage client is also reasonably isolated behind `IBackstageCatalogApi`.

Those ingredients do not yet form one coherent harness. There are three overlapping plugin/registry designs, two copies of several middleware and execution strategy implementations, and a decorator metadata path that is no longer connected to startup. The actual startup path explicitly registers only three tools even though the README and checked-in manifest advertise thirteen. Several metadata properties are descriptive only and do not affect execution. Context typing, caller authentication, lifecycle control, error signaling, manifest generation, logging, and tests need to be reconciled before this can be safely generalized.

The recommended direction is not another wrapper around the current builder. It is a small, SDK-adapted application kernel with one canonical definition model for tools, resources, and prompts; one registry; one execution pipeline; explicit dependency/context creation; transport adapters; and a start/stop handle. Backstage should then be migrated onto that generic kernel as a plugin.

## Current runtime path

The intended active path is:

```text
src/index.ts
  -> startServer()
     -> validate environment and build Backstage auth
     -> construct McpServer and BackstageCatalogApi
     -> initializeToolPlugins()
        -> singleton PluginRegistry
        -> PluginManager
        -> CatalogToolsPlugin
        -> CatalogToolFactory / ToolBuilder
        -> ToolRegistrar
     -> convert each Zod schema and call server.tool(...)
     -> connect StdioServerTransport
```

At call time:

```text
MCP tools/call
  -> SDK handler in server.ts
  -> EnhancedTool.execute
  -> schema.parse (first validation)
  -> ToolMiddlewarePipeline
  -> StandardExecutionStrategy
  -> BaseCatalogTool.execute
  -> schema.parse (second validation)
  -> concrete catalog operation
  -> BackstageCatalogApi
  -> IHttpClient / Axios
  -> text-wrapped JSON CallToolResult
```

Only `add_location`, `get_entity_by_ref`, and `get_entities` are registered by `CatalogToolsPlugin` in this path.

## MCP structure inventory

| Area                       | Current implementation                                                                | Runtime status               | Assessment                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Process entry point        | `src/index.ts`                                                                        | Active                       | Imports and immediately starts the server; also exports `startServer`. This mixes CLI side effects with library use.                          |
| Composition root           | `src/server.ts`                                                                       | Active                       | Constructs configuration, SDK server, API client, plugins, handlers, manifest output, and stdio transport in one function.                    |
| SDK transport              | `StdioServerTransport`                                                                | Active                       | The only transport. HTTP health middleware exists separately but is not hosted or connected.                                                  |
| Tool plugin system         | `base-tool.plugin.ts`, `plugin.manager.ts`, `plugin.registry.ts`, `tool.registrar.ts` | Active                       | Explicit plugin registration with a singleton registry. Duplicate names are rejected.                                                         |
| Consolidated plugin system | `plugin-system.ts`                                                                    | Apparently inactive          | Repeats the four active plugin-system classes in one file.                                                                                    |
| Direct SDK plugin system   | `plugin-manager.ts`                                                                   | Apparently inactive          | A different plugin contract receives `{ server, catalogClient }` and can register directly with the SDK.                                      |
| Tool authoring             | `tool-builder.ts`, `tool-factory.ts`                                                  | Active                       | Fluent metadata, middleware, and strategy composition around class-based tools.                                                               |
| Decorator authoring        | `decorators.ts`                                                                       | Inactive                     | Stores metadata in a module-level map, but no active loader consumes it. README instructions still describe this path.                        |
| Middleware                 | Individual `*.middleware.ts` files plus `middleware.ts`                               | Partly active and duplicated | The catalog factory uses individual middleware; the builder imports the pipeline from the consolidated file.                                  |
| Strategies                 | Individual `*.strategy.ts` files plus `execution-strategies.ts`                       | Partly active and duplicated | The builder defaults to the consolidated standard strategy. Cache and batch strategies are not selected by metadata.                          |
| Domain implementation      | `BaseCatalogTool` plus three concrete tools                                           | Active                       | Class-based template method with a second schema parse and uniform text JSON result.                                                          |
| Backstage adapter          | `BackstageCatalogApi`, `AxiosHttpClient`, `AuthManager`                               | Active                       | API client, auth interceptor, caching, pagination, formatting, and security audit concerns are combined in the adapter.                       |
| Response mapping           | `responses.ts`                                                                        | Active                       | Returns text content containing serialized application envelopes. Error envelopes do not set MCP `isError`.                                   |
| Manifest                   | `tools-manifest.json`, development write in `server.ts`                               | Drifted                      | Checked-in manifest lists 13 tools. Runtime plugin registers 3. Development startup writes a different metadata shape to the parent of `cwd`. |
| Health/metrics             | Health checker and Express middleware files                                           | Not connected to MCP runtime | Checks are registered, but no HTTP host mounts the middleware and some checks are placeholders.                                               |
| Tests                      | `test-mcp.js`, `scripts/test-mcp-tools.ts`                                            | Stale/manual                 | There are no `*.test.ts` or `*.spec.ts` files in the current working tree. Imports and inputs refer to previous paths/contracts.              |

## Implementation details

### Server construction and lifecycle

`startServer` hard-codes the server identity, reads process environment directly, creates every dependency, registers all features, creates an stdio transport, and connects it. It returns `Promise<void>`, so a programmatic caller receives no server handle and has no supported way to inspect features, stop the transport, dispose plugins, or close cache timers.

`src/index.ts` executes `startServer()` on import. Consequently the package's only public export cannot be safely imported as a library without also attempting to start an stdio server and requiring Backstage environment variables.

The plugin registry is a process-wide singleton. A second server construction in the same process reuses initialized plugin state and can fail duplicate registration. This makes isolation, tests, multiple differently configured servers, and clean restarts difficult.

### Feature registration

The active plugin model is two-stage: plugins register enhanced tools into a framework registry, after which `server.ts` loops over that registry and registers SDK handlers. This is a sound separation in principle, but the current metadata and execution contracts remain Backstage-specific.

`IToolExecutionContext` requires both `server` and `catalogClient`. The SDK handler passes `{ catalogClient, ...extra }`, not `server`. More importantly, a generic tool should not require the Backstage client or raw `McpServer`; dependencies should be an application-specific context type while SDK request data should have a separate stable invocation type.

The code supports only tools. There are no corresponding definitions or registration paths for MCP resources, resource templates, prompts, or other server capabilities.

### Tool definitions and type safety

`ToolBuilder` captures useful metadata and wraps a parameterless implementation class. Zod validation is present, but schema inference is discarded at the central interfaces: arguments become `Record<string, unknown>`, parsed values become `unknown`, and concrete tools cast them back to inferred types. A generic definition/handler pair can preserve input and output types without casts or a base class.

Validation occurs in `EnhancedTool.execute` and again in `BaseCatalogTool.execute`. Failures at the outer layer are converted by `StandardExecutionStrategy` into a generic `EXECUTION_ERROR`, while inner failures receive domain codes. The same invalid request can therefore be classified differently depending on which layer catches it.

Metadata such as `cacheable`, `maxBatchSize`, `requiredScopes`, `requiresConfirmation`, `deprecated`, and `version` is not compiled into one consistent runtime policy:

- `cacheable(true)` does not select `CachedExecutionStrategy`.
- `maxBatchSize` does not select `BatchExecutionStrategy`.
- `requiresConfirmation` has no enforcement point.
- `requiredScopes` affects execution only where a factory manually adds an authorization middleware with separately supplied scopes.
- deprecation and version metadata are not surfaced through MCP registration or invocation behavior.

### Middleware and execution

The priority-sorted onion pipeline is a useful foundation, but its mutable `index` belongs to each `execute` invocation only because it is declared locally. Middleware instances themselves can contain shared mutable process state; for example, rate limits are stored in an in-memory map owned by a tool's middleware instance.

Authentication has two different meanings that are currently conflated:

- `AuthManager` authenticates the server to Backstage with service credentials.
- `AuthenticationMiddleware` expects an MCP caller identity in `context.userId`.

The stdio request adapter does not establish `userId` or scopes. As a result, the registered write tool is expected to reject normal stdio calls unless nonstandard SDK `extra` data happens to supply those values. A generic harness needs an explicit caller-principal resolver per transport and a separately named upstream credential service.

There are also two cache layers: optional tool-result caching and caching internal to `BackstageCatalogApi`. They have different keys, TTLs, invalidation behavior, and ownership. Mutation tools do not visibly invalidate affected query results.

### Results and errors

Successful and failed domain operations are serialized into a JSON string in one MCP text content block. This is readable but loses protocol-level semantics and structured output:

- failures are ordinary `CallToolResult` values without `isError: true`;
- consumers must parse text to inspect `status`, `code`, or `data`;
- there is no output schema or `structuredContent` contract;
- transport/protocol, validation, policy, domain, and upstream errors are not consistently classified;
- the outer execution strategy catches all thrown failures and can hide actionable categories.

A harness should accept native MCP content, provide a convenient structured-data result, and have exactly one error boundary that maps known errors while preserving safe diagnostic context.

### Logging, operations, and security

The default Pino logger writes to stdout. For an stdio MCP server, stdout is the protocol channel; application logs on it can corrupt JSON-RPC framing. Logging for stdio must be directed to stderr or another sink. The ad hoc debug statements in `server.ts` use stderr, but they include complete argument objects and should be removed or routed through redacting structured logging.

The redaction in `LoggingMiddleware` is shallow and based on key substrings. Nested tokens, authorization headers, and secrets in arrays can still be logged. Correlation identifiers are random strings generated independently by multiple layers rather than propagated from one invocation context.

The historical `test-mcp.js` contained a hard-coded bearer credential. The file has been removed; the credential should still be removed from history where practical and rotated if it was ever valid.

Health checks are registered during MCP startup, but the Express health/readiness/metrics middleware is not mounted by the stdio server. `databaseHealthCheck` and `toolRegistryHealthCheck` return healthy placeholders rather than observing actual dependencies. In the current working tree, `health-checker.ts` and `metrics.middleware.ts` reference `errorMetrics` without a definition or import.

### Build, package, and test posture

The package targets Node 18+ in the README, NodeNext/ES2022 in TypeScript, and dual Rollup ESM/CommonJS bundles. Only `startServer` is exported, and import has startup side effects, so the package is not currently a practical harness library.

The current refactor leaves static compile blockers, including imports from missing `./types/types.js` and `./types/responses.js` modules, and unresolved `withErrorHandling` and `errorMetrics` identifiers. Some consolidated and individual modules also import different response locations. The test script still imports the prior nested source layout, while Jest mapping also targets directories that no longer exist.

Compilation could not be executed in this environment because `yarn` is unavailable and Corepack attempted to write its cache outside the permitted workspace. This limitation does not remove the statically visible blockers above. No automated test files remain in the working tree, so the current `jest --coverage` command has no maintained unit/integration suite to validate the MCP path.

### Documentation and runtime drift

The README describes dynamic discovery, decorator-based tool authoring under `src/tools`, thirteen catalog tools, and several documentation files/directories that are not present. Actual startup uses explicit registration in `CatalogToolsPlugin`, contains three tools, and uses a flattened `src` directory.

The development manifest path is `join(process.cwd(), '..', 'tools-manifest.json')`. When started from the repository root, this writes outside the repository rather than updating the checked-in root manifest. The generated shape also omits schemas and differs from the existing `params`-based file.

## Strengths to retain

- Zod schemas are colocated with domain tool implementations.
- The Backstage API has an interface suitable for test substitution.
- The HTTP client is injected into the Backstage adapter.
- Registry duplicate checks and plugin lifecycle hooks are useful concepts.
- Middleware provides an understandable extension point for cross-cutting behavior.
- Tool metadata already identifies several desired policies.
- The response helper safely serializes `bigint` values.
- The build intends to support CLI and programmatic consumers in both module systems.

## Priority findings

### P0: establish a trustworthy baseline

1. Complete or reconcile the flattening refactor so every import and identifier resolves.
2. Restore automated tests and make typecheck, lint, test, and build separate required gates.
3. Guarantee that stdio stdout contains protocol traffic only.
4. Remove the committed bearer credential and rotate it if necessary.

### P1: make runtime behavior match declarations

1. Replace the parallel plugin/registry/strategy/middleware implementations with one canonical path.
2. Separate generic invocation data, application dependencies, caller principal, and upstream credentials.
3. Compile policy metadata into actual middleware or reject unsupported metadata at registration.
4. Return protocol-correct errors and structured output.
5. Split side-effect-free library exports from the CLI entry point and expose lifecycle control.
6. Generate the manifest from the same immutable feature definitions used at runtime.

### P2: improve maintainability and product completeness

1. Add resources and prompts to the same definition model.
2. Add in-memory protocol contract tests and reusable feature test helpers.
3. Define transport-neutral observability, cancellation, timeout, and redaction behavior.
4. Reconcile cache ownership and mutation invalidation.
5. Replace placeholder health signals with checks tied to the application instance.
6. Update README claims and examples from generated, tested definitions.

## Architectural conclusion

The repository is closer to a collection of MCP framework experiments than to a single generic harness. The right consolidation point is an immutable feature definition and an application instance that compiles those definitions into SDK registrations. The SDK, transport, and protocol result mapping should sit at the boundary; middleware and application context should remain generic; Backstage should be one plugin. The detailed implementation sequence and target API are defined in the [MCP update plan](../plans/mcp-update.md).
