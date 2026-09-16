# Backstage MCP Server

A type-safe Model Context Protocol server for the Backstage Catalog API, built on a reusable generic MCP harness.

## Implemented tools

- `get_entities` — query catalog entities with filters, full-text search, field selection, ordering, and cursor pagination.
- `get_entity_by_ref` — retrieve one entity from a string or compound entity reference.
- `add_location` — add or dry-run a catalog location.

The checked-in `tools-manifest.json` is generated from the same definitions used by the runtime. It is the authoritative machine-readable feature list.

## Requirements

- Node.js 24 or newer for development, release, and MCP Inspector workflows
- Corepack and Yarn 4.4.0
- A Backstage instance and catalog API credential

## Install and verify

```bash
corepack enable
corepack install --global yarn@4.4.0
corepack yarn install --immutable
corepack yarn typecheck
corepack yarn lint
corepack yarn architecture:check
corepack yarn knip
corepack yarn test
corepack yarn test:shell
corepack yarn build
corepack yarn test:cli
corepack yarn test:inspector
corepack yarn manifest:check
```

After changing feature definitions, run `corepack yarn build` followed by `corepack yarn manifest:generate` to refresh the checked-in manifest.

The build produces side-effect-free library bundles at `dist/index.mjs` and `dist/index.cjs`, CLI bundles at `dist/cli.mjs` and `dist/cli.cjs`, and declarations at `dist/index.d.ts`.

## Configuration

Set `BACKSTAGE_BASE_URL` to the Backstage backend root (or the full `/api/catalog` URL) and provide `BACKSTAGE_TOKEN`.

The token is sent verbatim as a bearer credential. For a standalone external caller, use a sufficiently strong static token configured under Backstage `backend.auth.externalAccess`, or a JWT accepted by a configured JWKS external-access provider. Restrict the credential to the `catalog` plugin and the necessary permission actions where possible. Backstage's automatic plugin-to-plugin token flow is not available to an external standalone process.

Optional `LOG_LEVEL=debug` enables debug logging. All application logs go to stderr because stdout is reserved for stdio MCP protocol traffic.

See the [Backstage Catalog integration guide](docs/integrations/backstage-catalog.md) for endpoint mappings, token configuration, query semantics, and links to the current official documentation.

Example:

```bash
export BACKSTAGE_BASE_URL=https://backstage.example.com
export BACKSTAGE_TOKEN=your-token
corepack yarn start
```

## MCP client configuration

After building:

```json
{
  "mcpServers": {
    "backstage": {
      "command": "node",
      "args": ["/absolute/path/to/backstage-mcp-server/dist/cli.cjs"],
      "env": {
        "BACKSTAGE_BASE_URL": "https://backstage.example.com",
        "BACKSTAGE_TOKEN": "your-token"
      }
    }
  }
}
```

After global installation, use `backstage-mcp-server` as the command.

## Generic harness

The package exports a Backstage-independent MCP application kernel. Definitions are immutable, application instances do not share registries, and importing the library does not start a process.

```typescript
import { z } from 'zod';
import {
  connectTestClient,
  createMcpServer,
  definePlugin,
  defineTool,
  jsonResult,
  stdioTransport,
} from '@coderrob/backstage-mcp-server';

interface AppContext {
  greeting: string;
}

const hello = defineTool<AppContext>()({
  name: 'hello_user',
  description: 'Create a greeting.',
  inputSchema: z.object({ name: z.string().min(1) }),
  outputSchema: z.object({ message: z.string() }),
  annotations: { readOnlyHint: true },
  policy: { timeoutMs: 5_000 },
  handler({ input, context }) {
    return jsonResult({ message: `${context.greeting}, ${input.name}` });
  },
});

const plugin = definePlugin<AppContext>({
  name: 'greetings',
  version: '1.0.0',
  features: [hello],
});

const app = createMcpServer<AppContext>({
  identity: { name: 'example-server', version: '1.0.0' },
  plugins: [plugin],
  createContext: () => ({ greeting: 'Hello' }),
});

await app.start(stdioTransport());
```

### Supported primitives

- `defineTool<TContext>()`
- `defineResource<TContext>()`
- `defineResourceTemplate<TContext>()`
- `definePrompt<TContext>()`
- `definePlugin<TContext>()`

Tool and prompt handler inputs are inferred from their Zod schemas. Tools can declare timeout, caller-scope authorization, per-principal rate limiting, tagged caching, and tagged cache invalidation policies. Cached tools must declare the MCP `readOnlyHint` annotation or application creation fails.

### Results and errors

Use `textResult`, `jsonResult`, or `errorResult` for MCP-native results. `jsonResult` returns both text and `structuredContent`. Typed harness errors become results with `isError: true`, a stable code, and safe details; unexpected errors expose only a request identifier.

### Lifecycle

`createMcpServer` returns an application with `start`, `stop`, `state`, `listFeatures`, and `manifest`. Startup initializes the context and plugins before connecting the transport. Shutdown is idempotent and disposes the SDK server, plugins, and context in reverse ownership order.

### Testing

`connectTestClient(app)` connects an official MCP SDK client to the application using linked in-memory transports:

```typescript
const connection = await connectTestClient(app);
try {
  const result = await connection.client.callTool({
    name: 'hello_user',
    arguments: { name: 'Ada' },
  });
} finally {
  await connection.close();
}
```

The repository's colocated Vitest suite tests every behavioral source module, including tools, static resources, resource templates, prompts, structured results, errors, caching, Backstage argument forwarding, and application shutdown. Test files use `<module>.test.ts` beside `<module>.ts`; `architecture:check` enforces that relationship, and Vitest enforces 95% statements, branches, functions, and lines per production file. Type-only modules are excluded from runtime coverage. The same architecture gate requires a same-name `.bats` suite beside every `.sh` script; run them with `corepack yarn test:shell`. Knip rejects unused files, exports, dependencies, and unlisted dependencies through `corepack yarn knip`. The CLI smoke test launches the built CommonJS executable over stdio using the official SDK client.

For an independent black-box check, the repository pins the official open-source MCP Inspector. After building, run:

```bash
corepack yarn test:inspector
```

This launches the packaged stdio server through Inspector's CLI, validates `tools/list` with strict schema-portability checks, and calls `get_entities` against a deterministic authenticated Backstage stub. Run the complete MCP-specific gate with `corepack yarn test:mcp`. The [MCP end-to-end testing guide](docs/testing/mcp-end-to-end-testing.md) documents the complete process boundary, assertions, expected output, and current limitations.

For interactive inspection of a configured build, use:

```bash
corepack yarn mcp-inspector --tui node dist/cli.cjs
```

## Architecture

The generic implementation is under `src/mcp`. Only `sdk-adapter.ts` translates definitions into the installed MCP SDK registration API. `src/backstage/backstage.plugin.ts` contains the application-specific schemas and handlers, while `server.ts` creates the Backstage context and application. `cli.ts` alone owns process signals and stdio startup.

Source is grouped by ownership: `mcp/` contains the generic protocol kernel and its in-memory test support, `backstage/` contains the catalog adapter and domain features, `shared/` owns the canonical logging/error/validation concerns, and `types/` contains type-only adapter contracts. See [`src/README.md`](src/README.md) for the dependency boundaries.

The [documentation index](docs/README.md) links the baseline analysis, implementation plan, and architecture decision records.

## License

GPL-3.0. See `LICENSE`.
