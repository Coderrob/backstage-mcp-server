# Changelog

## [Unreleased]

### Fixed

- **Authentication and Security**: Implemented comprehensive authentication system with AuthManager supporting multiple auth methods (Bearer, OAuth, API keys, Service accounts), automatic token refresh, rate limiting, security auditing, and input sanitization. Added security interceptors to API client and audit logging for all operations.
- **Response Format Optimization**: Added FormattedTextResponse and MultiContentResponse utilities with specific formatters for entities, entity lists, and locations. Updated key tools to use formatted responses for better LLM interaction while maintaining JSON fallback.
- **Error Handling**: Added comprehensive error handling to all 13 tools with try-catch blocks, proper error logging, and MCP-formatted error responses using ApiStatus.ERROR.
- **README Documentation**: Created comprehensive README with project description, installation steps, configuration guide, usage examples, API reference, and development instructions. All markdown linting issues resolved.
- **Zod Schema Definitions**: Replaced all `z.custom<Type>()` with proper Zod object schemas for tool parameters, enabling MCP server to register tools successfully.
- **Configuration Management**: Added environment variable support for `BACKSTAGE_BASE_URL` and `BACKSTAGE_TOKEN` with validation.
- **Tool Export Completeness**: Added missing export for `GetEntityFacetsTool` in `tools/index.ts`.
- **Path Resolution Issues**: Fixed tool loading paths for production builds, including ES module URL handling and correct directory resolution.
- **Test Suite Failures**: Fixed test mocking to properly test tool loading logic without filesystem dependencies.
- **TypeScript Configuration**: Added `isolatedModules: true` to tsconfig.json to resolve ts-jest warnings.
- **Linting Configuration**: Created `.eslintrc.json` with TypeScript support and fixed linting issues.

### Changed

- Updated tool metadata storage to use a global Map instead of Reflect metadata for better compatibility.
- Modified tool factory to properly extract tool classes from ES modules.
- Refactored test suite to use inheritance-based mocking for better isolation.

### Technical

- All tools now use proper Zod schemas matching Backstage CatalogAPI types.
- Server validates required environment variables on startup.
- Tool loading works in both development and production environments.
