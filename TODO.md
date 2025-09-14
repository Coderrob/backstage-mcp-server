# Backstage MCP Server TODO

## Current Status Assessment

The repository has a well-structured foundation for an MCP server exposing Backstage CatalogAPI tools to LLMs. The core architecture includes:

- MCP server setup with StdioServerTransport
- Dynamic tool loading system with decorators
- Complete Backstage CatalogAPI client implementation
- Tool registration and validation framework

However, several issues remain to be addressed for a fully functional MCP server.

## Documentation and Usability

### Completed work (cleared)

The following major items were implemented and removed from the active backlog. They remain documented here for traceability and release notes.

- Authentication & security hardening (AuthManager, SecurityAuditor, input sanitization, rate limiting, multiple auth flows, audit logging).
- Performance improvements (LRU cache, TTL, pagination helper, JSON:API formatter, caching in `BackstageCatalogApi`).

These are now treated as completed and no longer appear in the active task list below.

### Active Backlog — prioritized actionable tasks

This backlog prioritizes maintainability, safety, and developer productivity following Clean Code (Uncle Bob) and Martin Fowler's refactoring principles.

Each item has a suggested priority, estimated effort (S/M/L), and a short rationale.

1. Introduce a logging abstraction (Priority: High, Effort: S)

- Create `src/logging/logger.ts` with `ILogger` and `ConsoleLogger`.
- Wire `ILogger` into `IToolRegistrationContext` and use it to replace `console.*` calls across tools and utils.
- Rationale: Centralizes logging, enables structured logs and easier tests.

2. Extract and formalize a cache interface (Priority: High, Effort: M)

- Add `ICacheManager` interface (get/set/del/wrap/stats).
- Make `src/cache/cache-manager.ts` implement `ICacheManager`.
- Update `BackstageCatalogApi` to accept `ICacheManager` via constructor (DI) with a sensible default.
- Rationale: Decouples caching from API client, allows swapping of strategies and easier testing.

3. Introduce a tool error-handling wrapper (Priority: High, Effort: S)

- Add `src/utils/tool-runner.ts` providing `runTool(handler, ctx)` which standardizes try/catch, logging and MCP error responses.
- Refactor one tool (example: `get_entities.tool.ts`) to use the wrapper; iterate to other tools after review.
- Rationale: Removes duplicated try/catch blocks and centralizes error format.

4. Remove/replace `any` usages and strengthen types (Priority: High, Effort: M)

- Replace `z.any()` uses with `z.unknown()` or explicit schemas where possible.
- Replace `(...args: any[]) => any` in decorators & maps with well-typed `ToolClass`/generics.
- Update guards to use `unknown` and narrower function types (e.g., `(...args: unknown[]) => unknown`).
- Rationale: Improves compile-time safety and documents expectations.

5. Decouple responsibilities in `BackstageCatalogApi` (Priority: Medium, Effort: L)

- Separate HTTP/transport, caching, and presentation concerns: create a thin `HttpClient` wrapper for axios + interceptors; keep caching in a dedicated service and presentation in formatter modules.
- Accept dependencies by interface in the constructor (DI pattern) and add a small factory for production wiring.
- Rationale: SRP and testability; makes future enhancements (retry, circuit-breaker) easier.

6. Avoid casting to concrete types for optional capabilities (Priority: Medium, Effort: S)

- Add optional capabilities via interfaces or extend `IToolRegistrationContext` with `formatter?: IJsonApiFormatter` and feature-detection helpers.
- Prefer runtime type guards over `as any` casts.

7. Consolidate tool metadata and decorator typing (Priority: Medium, Effort: M)

- Replace raw Map key/cast patterns in `src/decorators/tool.decorator.ts` and `src/utils/tool-metadata.ts` with strongly typed keys and generics so metadata carries param/return types where possible.

8. Strengthen validation and schema evolution (Priority: Medium, Effort: M)

- Add schema versioning metadata to tool definitions.

- Create `src/utils/schema-version.ts` and a small migration helper for future Backstage API changes.

9. Observability: metrics, health, and structured logs (Priority: Medium, Effort: M)

- Add a lightweight metrics collector interface `IMetrics` and a basic Prometheus-compatible metrics exporter endpoint.

- Add `/health` and `/metrics` endpoints to `server.ts` or a small observability module.

10. CI / linting / pre-commit (Priority: Medium, Effort: S)

- Tighten ESLint and TypeScript rules incrementally (e.g., `no-console` as warning->error in stages, `no-explicit-any` to warn then error).

- Add pre-commit hook to run `npm run build` or `tsc --noEmit` and tests.

11. Tests and contract tests (Priority: Medium, Effort: M)

- Add unit tests for `ICacheManager`, `PaginationHelper`, and `JsonApiFormatter`.

- Add a contract test ensuring tool loading and metadata validation. Add CI job for tests.

12. Packaging, deployment, and docs (Priority: Low, Effort: M)

- Add Dockerfile, basic deployment manifests, and a concise `RELEASE_NOTES.md` with completed items.

- Improve README usage examples for JSON:API output and cache behavior.

Notes:

- Start small and iterate. Implement the logger (item 1) and the tool-runner (item 3) first — both are small, low-risk, and unlock many other refactors.

- Use feature flags or runtime defaults when tightening rules (e.g., `no-explicit-any`) to avoid large breakages.

Suggested immediate tasks (next two sprints):

- Sprint 1 (2 weeks): Implement `ILogger`, implement `runTool` and refactor 3 most-used tools, introduce `ICacheManager` interface + update `BackstageCatalogApi` constructor.

- Sprint 2 (2 weeks): Replace `any` in decorators and guards, add health/metrics endpoint, create CI pipeline with `tsc` and tests.

## Development Workflow

### 5. Build and Deployment

**Problem**: Basic build script, no deployment configuration.

**Impact**: Difficult to deploy and maintain.

**Tasks**:

- Add Docker support
- Create deployment scripts
- Add CI/CD pipeline configuration
- Package as NPM module if appropriate

### 6. Development Tools

**Problem**: Missing development conveniences.

**Impact**: Slower development cycle.

**Tasks**:

- Add hot reload for development
- Create development scripts
- Add pre-commit hooks
- Setup VS Code workspace configuration

## Priority Implementation Order

1. **Critical Priority (Security)**: ✅ COMPLETED
2. **High Priority (Documentation)**: ✅ COMPLETED
3. **Medium Priority (Usability)**: ✅ COMPLETED
4. **Low Priority (Features)**: 2, 3, 4, 5, 6

## Production Readiness Criteria

- **Security & Authentication**
  - Multiple authentication methods supported (Bearer tokens, OAuth, API keys)
  - Automatic token refresh and expiration handling
  - Rate limiting and request sanitization implemented
  - Security audit passed with no critical vulnerabilities
  - Comprehensive audit logging for all operations

- **Core Functionality**
  - All tools load and register successfully
  - Server can connect to Backstage instance via environment config
  - All tests pass with >90% coverage
  - Basic CRUD operations work through MCP
  - Comprehensive documentation exists

- **Performance & Reliability**
  - Response times under 2 seconds for typical operations
  - Proper error handling with meaningful messages
  - Graceful degradation under load
  - Health checks and monitoring endpoints

- **Code Quality**
  - Code follows TypeScript and linting best practices
  - No security vulnerabilities in dependencies
  - Comprehensive test suite with CI/CD integration
  - Proper logging and observability
