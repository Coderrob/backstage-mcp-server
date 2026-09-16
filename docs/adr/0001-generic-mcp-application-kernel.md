# ADR 0001: Adopt a generic MCP application kernel

- Status: Accepted
- Date: 2026-09-15

## Context

The repository had overlapping plugin, registry, middleware, and execution models. Its active definitions were Backstage-specific, startup mixed library and process concerns, and SDK registration details were spread through application code. That made independent application instances, type-safe feature authoring, protocol-native results, and isolated tests difficult.

The [baseline analysis](../architecture/mcp-architecture-analysis.md) recommended consolidating these concepts around immutable feature definitions and an instance-owned application.

## Decision

Adopt a Backstage-independent MCP application kernel under [`src/mcp`](../../src/mcp) with these properties:

- `defineTool`, `defineResource`, `defineResourceTemplate`, `definePrompt`, and `definePlugin` form one canonical definition model.
- Application dependencies are expressed through a generic `TContext`; Backstage is an application plugin and context implementation.
- Registries and lifecycle state belong to an application instance rather than process-wide singletons.
- Feature registration is explicit and deterministic. The runtime does not scan files or decorator metadata.
- MCP SDK registration and schema conversion are isolated in [`sdk-adapter.ts`](../../src/mcp/sdk-adapter.ts).
- Handlers return MCP-native results, including structured content and `isError` semantics, through a single execution and error boundary.
- Importing the library has no startup side effect; the CLI owns stdio process behavior.

## Consequences

- Feature inputs and outputs retain Zod-derived types through handlers and tests.
- Multiple servers can be created in one process without shared registry state.
- SDK API changes are concentrated in one adapter and checked by protocol contract tests.
- Adding a feature requires an explicit plugin entry, which favors auditability over automatic discovery.
- Compatibility code may coexist during migration, but new MCP capabilities should use the kernel and the legacy authoring systems should not grow.
- An HTTP transport remains a separate decision because it introduces authentication, session, origin, and deployment policies beyond the kernel.

## Related material

- [MCP generic harness implementation plan](../plans/mcp-update.md)
- [ADR 0003: Verify MCP behavior at multiple boundaries](0003-mcp-verification-strategy.md)
