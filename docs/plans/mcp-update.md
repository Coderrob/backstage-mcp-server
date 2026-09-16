# MCP Generic Harness Implementation Plan

## Objective

Create a small, type-safe harness that makes an MCP server simple to define, compose, start, test, and stop. The harness will support tools, resources, resource templates, and prompts without depending on Backstage. The existing Backstage catalog behavior will become a plugin built on the harness.

The plan is based on the [MCP architecture analysis](../architecture/mcp-architecture-analysis.md). Durable choices extracted from the work are recorded in the [architecture decision records](../adr/README.md).

## Implementation status (September 2026)

The canonical path described here is implemented under `src/mcp`, with the Backstage catalog exposed as a typed plugin from `src/backstage/backstage.plugin.ts`. The delivered baseline includes immutable generic definitions, deterministic registration and manifests, SDK isolation, middleware, lifecycle ownership, native structured results, safe errors, timeout/scope/rate/cache policies, tagged invalidation, in-memory protocol tests, a side-effect-free library entry, and a protocol-safe stdio CLI. The verification stack now also includes the official open-source MCP Inspector as an independent stdio, schema-portability, and tool-invocation gate. The application plugin delegates Catalog protocol behavior to Backstage's official client; its supported API and authentication baseline are documented in the [Backstage Catalog integration guide](../integrations/backstage-catalog.md) and [ADR 0004](../adr/0004-official-backstage-catalog-client.md).

The legacy decorator, builder, plugin, middleware, strategy, health, and duplicate infrastructure implementations were audited as unreachable from both package entrypoints and removed. The remaining production surface has one generic MCP kernel, one Backstage plugin/adapter, and one shared logger. Every behavioral module has a colocated Vitest file, and coverage is enforced at 95% per file across statements, branches, functions, and lines. Streamable HTTP and distributed policy providers remain later-release work as specified by the non-goals below. The removal and verification floor are recorded in [ADR 0005](../adr/0005-remove-unreachable-compatibility-and-enforce-coverage.md).

## Success criteria

A feature author should be able to:

1. define a tool with one Zod schema and one typed function;
2. group tools, resources, and prompts into a plugin without using global state;
3. create an application with explicit dependencies, middleware, and a transport;
4. run the same definitions through stdio, an in-memory test transport, or a future HTTP transport;
5. receive consistent structured results, cancellation, policy enforcement, logging, and errors;
6. inspect or generate a manifest without starting a server;
7. test a feature without a live Backstage instance or a child process;
8. import the package without starting the CLI.

The migration is complete when the runtime manifest and documentation reflect the registered features, all public metadata has enforced behavior or is explicitly informational, and typecheck/lint/test/build pass from a clean checkout.

## Non-goals for the first release

- Automatic filesystem discovery or arbitrary runtime code loading.
- A general dependency-injection container.
- Distributed rate limiting or caching.
- Hot plugin reload.
- Maintaining the current decorator, builder, and direct-SDK plugin APIs indefinitely.
- Hosting a production Streamable HTTP service before stdio and the core lifecycle are stable.

## Design decisions

### One canonical definition model

Use immutable definitions returned by `defineTool`, `defineResource`, `defineResourceTemplate`, `definePrompt`, and `definePlugin`. Do not use class decorators, reflection metadata, a fluent builder, or direct SDK registration as the primary API.

Definitions are data plus a handler. They can be validated, inspected, tested, registered, and converted to a manifest without executing startup code.

### SDK behind an adapter

Feature authors should not receive `McpServer`. An internal SDK adapter maps definitions to the installed MCP SDK's registration calls. This isolates SDK signature and schema-representation changes to one module.

An explicit escape hatch may be added later for unsupported SDK capabilities, but it should not be needed for ordinary features.

### Typed application context

The harness is generic in application context. Backstage dependencies belong in `BackstageContext`; they do not belong in core MCP interfaces. The harness creates invocation metadata separately and passes both to handlers.

### No process-wide singleton state

Every call to `createMcpServer` creates an isolated registry, middleware pipeline, lifecycle state, and SDK server. Plugins and transports are owned by that application instance and disposed in reverse registration order.

### Explicit registration over implicit discovery

The composition root imports a plugin list. This is deterministic, bundler-friendly, secure, and easy to test. A future build-time generator may produce that list, but runtime directory scanning is not part of the core.

### Protocol-native results

Handlers may return native MCP content, while helpers provide a concise structured-data path. Known failures become `CallToolResult` values with `isError: true`; unexpected failures are caught once at the boundary. When supported by the SDK/protocol, typed data is exposed as `structuredContent` and validated against an output schema.

### Transport-aware logging

The logger is injected. The stdio runner defaults to stderr and must never write application logs to stdout. Invocation metadata supplies one request ID that all middleware and adapters propagate. Redaction is recursive and configurable.

## Target authoring API

The exact generic constraints may be adjusted during implementation, but the public shape should remain this small:

```typescript
import { z } from 'zod';
import { createMcpServer, definePlugin, defineTool, jsonResult, stdioTransport } from './mcp/index.js';

interface BackstageContext {
  catalog: IBackstageCatalogApi;
}

const getEntity = defineTool<BackstageContext>()({
  name: 'get_entity_by_ref',
  description: 'Get one Backstage catalog entity by reference.',
  inputSchema: z.object({ entityRef: z.string().min(1) }),
  annotations: { readOnlyHint: true },
  policy: {
    timeoutMs: 30_000,
    cache: { ttlMs: 120_000 },
  },
  async handler({ input, context }) {
    const entity = await context.catalog.getEntityByRef(input.entityRef);
    if (!entity) throw new McpNotFoundError('Entity', input.entityRef);
    return jsonResult(entity);
  },
});

const catalogPlugin = definePlugin<BackstageContext>({
  name: 'backstage-catalog',
  version: '1.0.0',
  features: [getEntity],
});

const app = createMcpServer<BackstageContext>({
  identity: { name: 'backstage-mcp-server', version: '2.0.0' },
  plugins: [catalogPlugin],
  createContext: async () => ({ catalog: createCatalogClientFromEnv() }),
  middleware: [requestLogging(), errorBoundary()],
});

await app.start(stdioTransport());
```

Handlers receive a stable invocation object:

```typescript
interface McpInvocation<TInput, TContext> {
  input: TInput;
  context: TContext;
  request: {
    id: string;
    feature: string;
    transport: string;
    principal?: { id: string; scopes: readonly string[] };
    signal: AbortSignal;
    startedAt: Date;
  };
}
```

The transport or application may resolve `principal`. Service credentials used by `context.catalog` remain a separate concern and are never treated as the MCP caller.

## Core contracts

### Feature definitions

`ToolDefinition<TContext, TInput, TOutput>` contains:

- `kind: 'tool'`;
- unique `name` and required `description`;
- `inputSchema` and optional `outputSchema`;
- MCP annotations supported by the SDK;
- optional harness policy (`timeout`, `cache`, `rateLimit`, `authorization`, `confirmation`, `deprecated`);
- a typed handler.

`ResourceDefinition`, `ResourceTemplateDefinition`, and `PromptDefinition` follow the same pattern, with fields appropriate to their MCP primitive. All definitions carry a source/plugin identity after compilation so duplicate diagnostics are actionable.

`PluginDefinition<TContext>` contains identity, features, optional startup/disposal hooks, and optional plugin-scoped middleware. It cannot register directly against the SDK.

### Application instance

`createMcpServer` returns an `McpApplication` with:

```typescript
interface McpApplication {
  readonly state: 'created' | 'starting' | 'running' | 'stopping' | 'stopped';
  start(transport: McpTransportFactory): Promise<void>;
  stop(reason?: string): Promise<void>;
  manifest(): McpManifest;
  listFeatures(): readonly CompiledFeature[];
}
```

Starting twice is rejected with a typed lifecycle error. Stopping is idempotent. Startup failure disposes successfully initialized components in reverse order. `SIGINT` and `SIGTERM` handling belongs in the CLI runner, not in the reusable application.

### Context lifecycle

Support application-scoped dependencies first:

```typescript
createContext(runtime): Promise<TContext> | TContext;
disposeContext?(context): Promise<void> | void;
```

If a future HTTP transport needs session- or request-scoped dependencies, add an explicit context scope rather than changing handler signatures. The initial stdio implementation creates one application context and reuses it.

### Middleware

Use one generic onion pipeline for all features:

```typescript
type McpMiddleware<TContext> = (
  invocation: UntypedInvocation<TContext>,
  next: () => Promise<McpResult>
) => Promise<McpResult>;
```

Order is explicit array order, not numeric priority. Compose layers in this order:

1. request identity and timing;
2. logging/tracing;
3. cancellation and timeout;
4. rate limit;
5. caller authentication/authorization;
6. confirmation policy where the transport supports it;
7. cache lookup;
8. handler;
9. output validation and cache write;
10. one outer error mapper.

Plugin middleware wraps feature middleware. Policies are compiled into middleware during registration. A definition using unsupported policy is rejected at startup instead of silently ignoring metadata.

### Errors and result helpers

Define a small error taxonomy:

- `McpInputError`;
- `McpAuthenticationError`;
- `McpAuthorizationError`;
- `McpNotFoundError`;
- `McpConflictError`;
- `McpRateLimitError`;
- `McpTimeoutError`;
- `McpUpstreamError`;
- `McpInternalError`.

Each has a stable code, a safe client message, optional safe details, and an optional cause used only for logs. Never serialize stacks, credentials, upstream response bodies, or raw Axios configuration to clients.

Provide helpers:

- `textResult(text)`;
- `jsonResult(value)`;
- `contentResult(content, structuredContent?)`;
- `errorResult(code, message, details?)` for expected non-throwing failures.

The boundary maps thrown harness errors to `isError: true` and maps unknown errors to `INTERNAL_ERROR` with a request ID.

### Registry and compilation

The registry accepts definitions and creates a read-only compiled feature set. At compile time it must:

- validate server, plugin, and feature identities;
- reject duplicate feature names within each MCP namespace;
- validate that policies have installed providers;
- preserve deterministic plugin/feature order;
- attach plugin provenance;
- prepare the middleware pipeline;
- generate the same manifest representation used by tooling;
- call the SDK adapter exactly once per feature.

No feature can be added after the application enters `starting` in the first release.

### Transport boundary

Define a narrow transport factory owned by the runtime adapter. Implement:

1. `stdioTransport()` for production CLI use;
2. `inMemoryTransport()` or an SDK client/server transport pair for tests;
3. Streamable HTTP in a later phase behind the same lifecycle contract.

Transport-specific authentication and session metadata are normalized into invocation request data. Feature code must not branch on SDK `extra` object shapes.

## Delivered source layout

```text
src/
  backstage/
    api/                   # Backstage Catalog API adapter
    auth/                  # Backstage authentication configuration
    backstage.plugin.ts    # canonical generic-harness plugin
  mcp/
    application.ts          # createMcpServer and lifecycle
    definitions.ts          # defineTool/resource/prompt/plugin
    registry.ts             # validation and compilation
    middleware.ts           # composition engine and built-ins
    results.ts              # protocol-native result helpers
    errors.ts               # error taxonomy and mapper
    sdk-adapter.ts          # only module coupled to MCP SDK registration
    transports.ts           # stdio and custom transport factories
    testing.ts              # official SDK in-memory test client
    index.ts                # side-effect-free public exports
  shared/
    errors/ logging/ validation/
  types/                    # type-only Backstage adapter contracts
  cli.ts                    # env loading, signals, stderr logger, app.start
  server.ts                 # Backstage composition root
  generate-manifest.ts      # deterministic manifest entrypoint
  index.ts                  # side-effect-free package exports
```

Every behavioral module shown above has a colocated `.test.ts` file. The repository remains one package because it has one release artifact and one CLI. The `mcp/` boundary is intentionally independent so it can become a Yarn workspace later if it gains separate consumers and versioning. `yarn architecture:check` prevents new root-level implementation files, rejects application imports from `mcp/`, requires colocated tests, and detects circular dependencies.

## Migration map

| Current code                                                   | Target                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| `ToolBuilder`, `CatalogToolFactory`, `QuickToolFactory`        | `defineTool` plus reusable policy presets/helper functions    |
| `ITool`, `IEnhancedTool`, parameterless implementation classes | Typed function handlers                                       |
| Three plugin systems                                           | One immutable `PluginDefinition` and instance-owned registry  |
| `ToolMiddlewarePipeline` and numeric priorities                | One array-ordered generic pipeline                            |
| Strategy objects                                               | Built-in policy middleware or explicit handler composition    |
| `BaseCatalogTool`                                              | Shared result/error helpers; no inheritance required          |
| `IToolExecutionContext` with `McpServer` and catalog client    | Generic `TContext` plus separate invocation request metadata  |
| `responses.ts` status envelope                                 | Native MCP error flag/content plus optional structured output |
| `tools-manifest.json` maintained separately                    | Deterministic output generated from compiled definitions      |
| `startServer(): Promise<void>`                                 | `McpApplication` plus thin `cli.ts` runner                    |
| Global plugin and health singletons                            | Application-owned services                                    |
| Express health middleware disconnected from stdio              | Optional transport/operations adapter using application state |

## Delivery phases

### Phase 0: restore the baseline

Tasks:

- finish the flattening refactor and choose the canonical locations;
- remove imports of deleted `types/types` and `types/responses` modules;
- restore or replace `withErrorHandling` and `errorMetrics` deliberately;
- remove aggregate/individual duplicate implementations after updating imports;
- restore a minimal automated test suite;
- remove the committed bearer credential and use environment-driven test fixtures;
- send all stdio-mode application logging to stderr;
- add independent `typecheck`, `lint`, `test`, and `build` scripts.

Acceptance:

- all four commands pass from a clean checkout;
- importing the test target emits no protocol or network side effects;
- a smoke client initializes, lists the three actual tools, calls one, and shuts down;
- no test fixture contains a credential-shaped literal.

### Phase 1: add typed definitions and an instance registry

Tasks:

- create the `src/mcp` contracts and `define*` identity helpers;
- implement immutable definitions and duplicate validation;
- implement `definePlugin` with startup/disposal hooks;
- implement deterministic manifest generation from definitions;
- unit-test schema inference with compile-time type fixtures and runtime validation tests.

Acceptance:

- a tool handler's `input` type is inferred from its Zod schema without a cast;
- two application instances can register the same plugin independently;
- duplicate names report both plugin sources;
- manifest generation requires no environment variables and starts no transport.

### Phase 2: implement the execution kernel

Tasks:

- implement array-ordered middleware composition;
- add request ID, cancellation, timeout, logging/redaction, and error-boundary middleware;
- compile authorization, rate-limit, cache, confirmation, and deprecation policies;
- add output validation and native result helpers;
- define stable error codes and `isError` mapping;
- make cache providers injectable and define cache-key/invalidation interfaces.

Acceptance:

- middleware order and short-circuit behavior are covered by tests;
- abort signals reach handlers and timeout returns `TIMEOUT`;
- unsupported policies fail application creation;
- errors are protocol-visible and do not leak causes;
- nested configured secrets are redacted;
- cached results are never shared across principals unless policy explicitly allows it.

### Phase 3: SDK adapter, transports, and lifecycle

Tasks:

- map compiled tools, resources/templates, and prompts through one SDK adapter;
- use the SDK's canonical schema registration shape in that adapter;
- implement the application state machine and rollback-safe startup;
- implement stdio and in-memory transports;
- implement idempotent shutdown and reverse-order disposal;
- split `src/index.ts` from `src/cli.ts` and update Rollup/package exports for library and CLI entry points.

Acceptance:

- package import has no side effects;
- CLI stdout contains only MCP protocol messages;
- start/stop/restart rules are deterministic and tested;
- initialized plugin/context resources are disposed after startup failure;
- SDK client contract tests cover initialize, list, call/read/get, cancellation, error, and shutdown paths.

### Phase 4: migrate the Backstage plugin

Tasks:

- define `BackstageContext` and inject `IBackstageCatalogApi`;
- migrate the three active tools to typed function definitions;
- distinguish upstream Backstage auth from MCP caller identity;
- choose one cache owner and add mutation invalidation rules;
- remove migrated builder, base class, registrar, strategy, and decorator paths;
- decide whether each of the ten manifest-only tools is implemented, deferred, or removed from product claims.

Acceptance:

- migrated tools preserve validated inputs and useful response data;
- `add_location` has an explicit, testable caller policy suitable for stdio;
- Backstage failures map to stable upstream/not-found/conflict errors;
- runtime feature listing, generated manifest, README, and tests name the same tools;
- no generic `src/mcp` module imports a Backstage package.

### Phase 5: developer experience and testing

Tasks:

- create `testFeature` for direct schema/handler/middleware tests;
- create `createTestServer` backed by an in-memory transport;
- add fake context and principal builders;
- add a manifest command and drift check;
- add one complete example plugin containing a tool, resource, template, and prompt;
- rewrite the README's authoring, CLI, configuration, and client examples.

Acceptance:

- a new tool requires one definition file and one plugin-array entry;
- tests run without spawning a process or reaching Backstage by default;
- generated artifacts are deterministic across operating systems;
- CI fails on manifest or documentation feature-list drift.

### Phase 6: operations and optional HTTP transport

Tasks:

- expose application health from lifecycle state and registered providers;
- replace placeholder health checks with real dependency probes or label them informational;
- attach metrics to the execution kernel rather than disconnected Express middleware;
- add Streamable HTTP only after defining session, origin, authentication, CORS, and shutdown policies;
- document trusted-proxy and rate-limit-store requirements for multi-instance deployment.

Acceptance:

- health/readiness accurately reflect application and dependency state;
- metrics use bounded label cardinality and never include raw inputs;
- HTTP conformance and security tests pass before the transport is enabled by default.

## Testing strategy

The executable commands, validated process boundary, expected output, and limits of the automated environment are maintained in the [MCP end-to-end testing guide](../testing/mcp-end-to-end-testing.md).

### Unit tests

- one colocated test file for every behavioral production module;
- 95% statements, branches, functions, and lines for every covered file, not only in aggregate;
- definition validation and TypeScript inference;
- duplicate/provenance diagnostics;
- middleware order, short circuit, and thrown errors;
- policy compilation;
- result serialization, `bigint`, and output schema failures;
- lifecycle state transitions and disposal;
- manifest determinism;
- recursive redaction and cache key isolation.

### Protocol contract tests

Use the MCP SDK client against the in-memory transport to test:

- initialize and capability negotiation;
- tools list/call with valid and invalid input;
- resources list/read and templates;
- prompts list/get;
- cancellation and timeout;
- `isError` and structured output;
- clean shutdown.

### Backstage adapter tests

Use `IBackstageCatalogApi` fakes for feature tests and an injected `IHttpClient` fake for adapter tests. Cover auth header behavior, pagination, not-found, upstream error mapping, cache invalidation, and input-to-request mapping. Live Backstage tests should be opt-in and excluded from the default suite.

### CLI smoke tests

Spawn the built CLI with test configuration, communicate through an SDK client/stdio transport, assert stderr/stdout separation, list the expected features, call one tool, and terminate gracefully.

### Independent Inspector tests

Run the official MCP Inspector CLI against the built stdio executable. Its strict `tools/list` mode provides an implementation-independent schema-portability check, while a real `tools/call` verifies process launch, protocol negotiation, environment forwarding, authentication, and result serialization. Keep Inspector state in a per-run temporary directory so developer credentials and user configuration cannot affect CI.

## Packaging and compatibility

Publish separate exports:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./mcp": {
      "types": "./dist/mcp.d.ts",
      "import": "./dist/mcp.mjs",
      "require": "./dist/mcp.cjs"
    }
  },
  "bin": {
    "backstage-mcp-server": "./dist/cli.cjs"
  }
}
```

Keep the first harness release internal to this package until the Backstage migration and API tests settle. If later published as a standalone package, use semantic versioning and an explicit supported matrix for Node, MCP SDK, and Zod versions.

Do not maintain two working authoring systems. During migration, temporary adapters may translate an old tool into a new definition, but they should be marked deprecated and removed on a dated milestone.

## Pull request sequence

Keep changes reviewable and avoid combining mechanical moves with behavior changes:

1. baseline repair, secret removal, and stdout logging fix;
2. core definitions, registry, and manifest tests;
3. middleware, policies, results, and errors;
4. SDK adapter, in-memory transport, and contract tests;
5. lifecycle, stdio runner, and package entry split;
6. migrate read-only Backstage tools;
7. migrate mutation tools, caller policy, and cache invalidation;
8. remove legacy systems, enforce per-file coverage, and update documentation;
9. add resources/prompts example and optional operations adapter.

Each PR should leave typecheck, tests, and build green. Compatibility adapters, when needed, should be introduced before consumers move and removed only after the migrated path is covered.

## Key risks and mitigations

| Risk                                                       | Mitigation                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| MCP SDK registration APIs change                           | Keep all SDK imports and schema conversion in `sdk-adapter.ts`; contract-test the installed version.  |
| Generic types become difficult to use                      | Prefer curried `defineTool<TContext>()({...})`, inference tests, and a small public surface.          |
| Policy metadata again becomes decorative                   | Compile every supported policy, and reject a policy without a provider.                               |
| Stdio protocol is corrupted by logs                        | Inject logger destination; smoke-test that stdout parses exclusively as protocol frames.              |
| Caller auth is assumed where a transport cannot provide it | Make principal resolution explicit per transport and fail configuration at startup.                   |
| Cache leaks or stale mutation results                      | Include principal/tenant in keys by default, make providers injectable, and define invalidation tags. |
| Migration preserves duplicate frameworks                   | Set removal checkpoints and prohibit new features on legacy APIs once Phase 1 merges.                 |
| Refactor makes failures hard to attribute                  | Restore baseline first, then use small PRs with protocol tests at every boundary.                     |

## Definition of done

The generic harness is done when:

- one documented API defines tools, resources, templates, prompts, and plugins;
- Backstage is only an application plugin/context, not a core type dependency;
- the server can be instantiated more than once without shared state;
- library import is side-effect free and the CLI owns process behavior;
- all declared safety and execution policies are enforced;
- results and errors use MCP-native semantics with typed structured data where available;
- stdio logging is protocol-safe;
- manifest and documentation derive from the same definitions;
- unit, protocol, adapter, and CLI smoke tests pass;
- legacy plugin, builder, decorator, middleware, and strategy duplicates are removed;
- a new feature can be implemented and tested without editing server bootstrap internals.
