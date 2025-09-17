# Unit Test Planning and Implementation

This document outlines the comprehensive unit testing plan for the backstage-mcp-server repository, following the established testing standards and expectations.

## Overview

- **Testing Framework**: Jest with TypeScript
- **Coverage Requirements**: 95% statements, branches, functions, lines
- **Test Location**: Side-by-side with source files (e.g., `Bar.ts` → `Bar.test.ts`)
- **Mock Strategy**: Readonly mocks, cleared in afterEach
- **Structure**: One describe per unit, nested for methods

## Test Implementation Plan

### 1. Core Utilities (`src/utils/core/`)

#### assertions.ts

**Functions**: `isValidEntityKind`, `isValidEntityNamespace`, `isValidEntityName`

**Dependencies**:

- `VALID_ENTITY_KINDS` from entities.ts
- `isString`, `isNonEmptyString` from guards.ts

**Positive Cases**:

- Valid entity kinds return true
- Valid namespaces/names return true

**Negative Cases**:

- Invalid kinds return false
- Empty/invalid strings return false

**Test Structure**:

- Table-driven tests for each function
- Mock guards if needed

#### guards.ts

**Functions**: `isString`, `isNumber`, `isObject`, `isFunction`, `isNonEmptyString`, `isStringOrNumber`, `isBigInt`

**Dependencies**: None (pure functions)

**Positive/Negative Cases**: Standard type checks

**Test Structure**: Table-driven with various inputs

#### logger.ts

**Functions**: Logger instance creation

**Dependencies**: Pino library

**Test Structure**: Mock pino, verify calls

#### mapping.ts

**Functions**: `mapEntityToJsonApi`, `mapJsonApiToEntity`

**Dependencies**: Type definitions

**Test Structure**: Input/output mapping tests

### 2. Formatting Utilities (`src/utils/formatting/`)

#### entity-ref.ts

**Class**: `EntityRef`

**Methods**: `parse`, `stringify`, `isValid`

**Dependencies**: Guards, constants

#### jsonapi-formatter.ts

**Class**: `JsonApiFormatter`

**Methods**: `entityToResource`, `resourceToEntity`, etc.

**Dependencies**: Type definitions

#### pagination-helper.ts

**Class**: `PaginationHelper`

**Methods**: `normalizeParams`, `buildMeta`, `applyPagination`

**Dependencies**: Guards

#### responses.ts

**Functions**: `FormattedTextResponse`, `JsonToTextResponse`, `createSimpleError`, etc.

**Dependencies**: Type definitions

### 3. Tool Utilities (`src/utils/tools/`)

#### tool-error-handler.ts

**Class**: `ToolErrorHandler`

**Methods**: `handleError`, `createErrorResponse`

**Dependencies**: Formatting functions

#### tool-factory.ts

**Class**: `DefaultToolFactory`

**Methods**: `create`

**Dependencies**: File system, module loading

#### tool-loader.ts

**Class**: `ToolLoader`

**Methods**: `registerAll`, `addToManifest`

**Dependencies**: Tool classes, file system

#### tool-metadata.ts

**Classes**: `ReflectToolMetadataProvider`

**Methods**: `getMetadata`

**Dependencies**: Reflection API

#### tool-registrar.ts

**Class**: `DefaultToolRegistrar`

**Methods**: `register`

**Dependencies**: Server context

#### tool-validator.ts

**Class**: `DefaultToolValidator`

**Methods**: `validate`

**Dependencies**: Metadata schema

#### validate-tool-metadata.ts

**Function**: `validateToolMetadata`

**Dependencies**: Zod schemas

### 4. API Layer (`src/api/`)

#### backstage-catalog-api.ts

**Class**: `BackstageCatalogApi`

**Methods**: All catalog operations (getEntities, addLocation, etc.)

**Dependencies**: Axios, auth, cache, formatting

### 5. Auth Layer (`src/auth/`)

#### auth-manager.ts

**Class**: `AuthManager`

**Methods**: `authenticate`, `getToken`, `refreshToken`

**Dependencies**: Axios, environment

#### input-sanitizer.ts

**Class**: `InputSanitizer`

**Methods**: `sanitizeString`, `sanitizeObject`

**Dependencies**: Guards

#### security-auditor.ts

**Class**: `SecurityAuditor`

**Methods**: `auditRequest`, `logEvent`

**Dependencies**: Logger

### 6. Cache Layer (`src/cache/`)

#### cache-manager.ts

**Class**: `CacheManager`

**Methods**: `get`, `set`, `clear`, `cleanup`

**Dependencies**: Timers, logger

### 7. Decorators (`src/decorators/`)

#### tool.decorator.ts

**Decorator**: `Tool`

**Dependencies**: Metadata reflection

### 8. Tools (`src/tools/`)

Each tool class has an `execute` method with specific logic.

**Common Dependencies**: API client, input sanitizer, response formatters

**Test Structure**: Mock API, test success/error responses

### 9. Main Files

#### server.ts

**Function**: `startServer`

**Dependencies**: Environment, all components

#### generate-manifest.ts

**Function**: Main export

**Dependencies**: Tool loading components

## Implementation Instructions

1. Create test files side-by-side with source files
2. Use the canonical skeleton from standards
3. Mock all external dependencies
4. Cover positive and negative paths
5. Use table-driven tests where appropriate
6. Assert call counts and parameters
7. Ensure 95%+ coverage

## Memory Leak Prevention

- Clear all mocks in afterEach
- Use jest.resetModules() for module isolation
- Avoid global state
- Run tests with --detectLeaks flag

## Coverage Verification

Run `npm test -- --coverage` and verify:

- Statements: ≥95%
- Branches: ≥95%
- Functions: ≥95%
- Lines: ≥95%
