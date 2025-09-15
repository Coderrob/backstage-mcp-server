# Utils Directory Structure

This directory contains utility functions and classes organized by functionality:

## Directory Structure

```
utils/
├── core/                    # Core utilities
│   ├── guards.ts           # Type guards and validation functions
│   ├── logger.ts           # Logging utilities
│   └── mapping.ts          # Data mapping and transformation utilities
├── formatting/             # Response formatting and API utilities
│   ├── jsonapi-formatter.ts # JSON:API specification implementation
│   ├── pagination-helper.ts # Pagination utilities
│   └── responses.ts        # Response formatting and error handling
├── tools/                  # Tool-related utilities
│   ├── tool-error-handler.ts    # Tool execution error handling
│   ├── tool-factory.ts          # Tool instantiation factory
│   ├── tool-loader.ts           # Tool loading and registration
│   ├── tool-metadata.ts         # Tool metadata extraction
│   ├── tool-registrar.ts        # Tool registration logic
│   ├── tool-validator.ts        # Tool validation utilities
│   └── validate-tool-metadata.ts # Tool metadata validation
├── tests/                  # Test files and fixtures
│   ├── *.test.ts          # Unit tests for utilities
│   └── __fixtures__/      # Test fixtures and mock data
└── index.ts               # Main exports for the utils module
```

## Usage

Import utilities from the main index:

```typescript
import { logger, isString, PaginationHelper } from '../utils';
```

Or import directly from specific modules:

````typescript
import { logger } from '../utils/core/logger';
import { JsonApiFormatter } from '../utils/formatting/jsonapi-formatter';
```</content>
<parameter name="filePath">D:\backstage-mcp-server\src\utils\README.md
````
