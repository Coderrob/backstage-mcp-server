# Source organization

The source tree is grouped by ownership and change reason:

- `mcp/` is the reusable, Backstage-independent protocol kernel. It owns definitions, registration, lifecycle, middleware, results, transports, and protocol test support.
- `backstage/` owns Backstage-specific API integration, authentication, catalog tools, and plugin definitions.
- `shared/` contains the single cross-cutting constant, error, logging, and validation implementations.
- `types/` contains reusable type-only contracts grouped by concern: MCP, Backstage, logging, CLI, and authentication.
- Root files are package/process entrypoints: `index.ts`, `server.ts`, `cli.ts`, and `generate-manifest.ts`.

Every behavioral production module has a colocated `<module>.test.ts` file. Type-only modules under `types/` are exempt because they emit no runtime behavior. The architecture checker enforces this rule, while Vitest enforces at least 95% statements, branches, functions, and lines for every covered file.

## Dependency direction

1. `mcp/` must not import Backstage packages or application modules. It may consume explicitly allowlisted, domain-neutral constants, type contracts, and shared implementations.
2. `backstage/` may depend on `mcp/`, `shared/`, and `types/`.
3. Reusable contracts live in `types/`; logging behavior, redaction, and stderr-safe sinks live only in `shared/logging`.
4. Root entrypoints compose these areas but must not contain reusable domain logic.

These boundaries intentionally keep the repository as one package. If the generic MCP harness later receives independent consumers, `mcp/` can become a Yarn workspace without first untangling application-specific dependencies. See [ADR 0002](../docs/adr/0002-source-boundaries-and-single-package.md) for the decision and its extraction criteria.
