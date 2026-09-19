# Source organization

The source tree is grouped by ownership and change reason:

- `backstage/` owns Backstage-specific API integration, authentication, catalog tools, and plugin definitions.
- `shared/` contains Backstage constants, error helpers, and validation implementations.
- `types/` contains reusable type-only contracts for Backstage, the CLI, authentication, and test fixtures.
- Root files are package/process entrypoints: `index.ts`, `server.ts`, `cli.ts`, and `generate-manifest.ts`.

The published `@coderrob/mcp-kernel` dependency owns generic MCP definitions, registration, lifecycle, middleware, results, transports, testing support, protocol constants, and logging contracts.

Every behavioral production module has a colocated `<module>.test.ts` file. Type-only modules under `types/` are exempt because they emit no runtime behavior. The architecture checker enforces this rule, while Vitest enforces at least 95% statements, branches, functions, and lines for every covered file.

## Dependency direction

1. `backstage/` may depend on `@coderrob/mcp-kernel`, `shared/`, and `types/`.
2. Generic MCP behavior and logging contracts must come from `@coderrob/mcp-kernel`; local kernel modules are rejected by the architecture check.
3. Backstage-specific reusable contracts live in `types/`.
4. Root entrypoints compose these areas but must not contain reusable domain logic.

See the [current architecture overview](../docs/architecture/overview.md) for the published package boundary.
