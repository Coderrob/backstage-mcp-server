# MCP End-to-End Testing

## Canonical command

Run the complete MCP-specific verification gate from the repository root:

```bash
corepack yarn test:mcp
```

The command is defined in [`package.json`](../../package.json) and executes, in order:

```text
test:contract
  -> build
  -> test:cli
  -> test:tools
  -> test:inspector
```

A failure in any stage stops the gate with a nonzero exit code.

## Validated runtime path

The two black-box stages exercise the packaged CommonJS CLI through this process boundary:

```text
Official MCP SDK client or MCP Inspector
  -> stdio JSON-RPC
  -> node dist/cli.cjs
  -> generic MCP application kernel
  -> Backstage MCP plugin
  -> BackstageCatalogApi
  -> authenticated HTTP request
  -> deterministic local Backstage stub
  -> structured MCP response
```

This is intentionally different from importing a handler and calling it directly. It validates process launch, the published bundle, stdio framing, MCP initialization, capability discovery, SDK registration, input handling, application composition, upstream authentication, HTTP mapping, and response serialization together.

## Gate stages

### Vitest contract tests

`test:contract` runs the colocated Vitest files [`application.test.ts`](../../src/mcp/application.test.ts), [`backstage.plugin.test.ts`](../../src/backstage/backstage.plugin.test.ts), and [`backstage-catalog-api.test.ts`](../../src/backstage/api/backstage-catalog-api.test.ts).

The generic application suite connects the official MCP SDK client through linked in-memory transports. It covers tools, resources, resource templates, prompts, structured results, typed errors, policy enforcement, authenticated and anonymous cache isolation, expiry and invalidation, cancellation, deterministic manifests, lifecycle rollback, concurrent shutdown, and cleanup failures.

The Backstage plugin suite verifies the complete 13-tool surface and invokes every tool through an official MCP SDK client using a typed Catalog client fake. It checks argument forwarding, compound-reference normalization, cursor semantics, upstream error mapping, and optional lookup behavior.

The Backstage adapter suite runs the official `CatalogClient` against an injected fetch boundary. It verifies backend URL normalization, the current `/entities/by-query` contract, bearer authentication, canonical entity-reference routing, and location mutation parameters without requiring a live deployment.

### Distribution build

`build` generates the actual artifacts consumed by external users:

- `dist/index.mjs` and `dist/index.cjs` for library consumers;
- `dist/cli.mjs` and `dist/cli.cjs` for process execution; and
- `dist/index.d.ts` for TypeScript consumers.

The subsequent black-box stages run `dist/cli.cjs`; they do not execute source files through a TypeScript loader.

### SDK stdio smoke test

`test:cli` runs [`scripts/smoke-cli.mjs`](../../scripts/smoke-cli.mjs). The runner:

1. starts an HTTP server on an ephemeral loopback port;
2. launches `node dist/cli.cjs` using the official SDK `StdioClientTransport`;
3. injects the stub URL and a test-only bearer token through the child environment;
4. initializes MCP and asserts the exact tool list;
5. calls `get_entities` through stdio;
6. verifies that the catalog stub received the expected authenticated request;
7. validates the structured MCP result; and
8. closes the MCP client, child transport, and HTTP stub.

### Independent MCP Inspector test

`test:inspector` runs [`scripts/test-inspector.mjs`](../../scripts/test-inspector.mjs). It launches the built CLI through the open-source MCP Inspector and:

1. performs strict `tools/list` validation to catch non-portable schemas;
2. invokes `get_entities` through `tools/call`;
3. verifies the authenticated request at a separate deterministic Backstage stub; and
4. isolates Inspector configuration and credential state in a temporary directory.

This stage supplies an implementation-independent check in addition to the SDK client used by the application.

### Complete tool-surface smoke test

`test:tools` runs [`scripts/smoke-all-tools.mjs`](../../scripts/smoke-all-tools.mjs). It starts a deterministic HTTP boundary, launches the packaged `dist/cli.cjs` in a separate child process, connects only through the official MCP SDK's `StdioClientTransport`, lists the tools, and invokes all 13 through `tools/call`.

The smoke client does not import `BackstageCatalogApi`, tool handlers, or a direct HTTP client. The HTTP stub records the 13 requests received from the child server and asserts their method, Catalog route, and server-injected bearer credential. This creates observable evidence for both halves of the end-to-end path: MCP JSON-RPC crossed stdio, and the MCP server—not the test client—crossed the Catalog HTTP boundary.

## Expected successful output

The final stages should report equivalent results to:

```text
Test Files  3 passed (3)
CLI smoke test passed (13 tools, one authenticated call)
All-tools MCP smoke test passed (13 MCP calls, 13 authenticated Catalog requests)
MCP Inspector test passed (13 portable tools, one tool call)
```

## Scope and limitations

The automated gate proves that the packaged stdio server works end to end against a deterministic Backstage-compatible HTTP endpoint. It does not claim all of the following:

- connectivity, permissions, TLS, or entity behavior for a particular Backstage deployment;
- black-box stdio invocation of every individual tool—the complete surface is discovered through stdio, while every handler is invoked through the in-memory MCP contract suite;
- interoperability with every MCP client implementation; or
- an HTTP MCP transport, because the shipped transport is stdio.

A real-environment integration test remains opt-in because it requires external credentials. Its default check should call only `get_entities`; mutation tools require separate authorization and an expendable catalog target.

## Testing a real Backstage deployment

Provide credentials through the environment and run the opt-in read-only live test:

```powershell
$env:BACKSTAGE_BASE_URL = 'http://localhost:7007'
$env:BACKSTAGE_TOKEN = '<token>'
corepack yarn test:live
```

The test builds the distribution, launches `dist/cli.cjs` over stdio with the official SDK client, asserts all 13 tool definitions, and calls `get_entities` with `limit: 1` against the configured deployment. It never prints the credential. Do not commit credentials or place them in command arguments. Invoke mutations only where catalog changes are explicitly authorized.

## Complete repository verification

Use these additional gates before release:

```bash
corepack yarn lint
corepack yarn typecheck
corepack yarn architecture:check
corepack yarn knip
corepack yarn test
corepack yarn test:shell
corepack yarn test:mcp
corepack yarn manifest:check
```

`test` runs every colocated Vitest file with V8 coverage. [`vitest.config.mjs`](../../vitest.config.mjs) requires at least 95% statements, branches, functions, and lines for each production file, so a high aggregate cannot hide an undertested module. [`architecture:check`](../../scripts/check-source-layout.mjs) separately rejects a behavioral TypeScript module without a side-by-side test and a `.sh` script without a same-name `.bats` suite. Type-only declarations under `src/types` are excluded because they have no emitted runtime behavior. `knip` rejects unreachable files and exports, unused dependencies, and undeclared imports. `test:shell` runs the isolated BATS suite for repository automation. `test:mcp` focuses on MCP contracts and the packaged protocol path.

## Shell automation tests

Every `.sh` file under `scripts` has a colocated `.bats` test. The tests copy their target into a BATS-managed temporary project, so dependency reports, build audits, monitoring logs, backups, and command stubs never modify the working tree. Sourceability tests also verify that importing a script exposes its functions without executing its command-line entrypoint.

Run the complete shell suite from any supported host:

```bash
corepack yarn test:shell
```

[`run-bats.mjs`](../../scripts/run-bats.mjs) launches BATS with `BASH_PATH` when configured, the Bash on `PATH` on Unix-like systems, or Git for Windows Bash when detected. CI runs the same package command.
