# Backstage MCP Server

A production-ready, enterprise-grade Model Context Protocol (MCP) server that exposes the Backstage Catalog API as tools for Large Language Models (LLMs). Features comprehensive operational transparency, cross-platform compatibility, and automated error recovery.

This allows LLMs to interact with Backstage software catalogs through a standardized protocol with enterprise-grade reliability and monitoring.

## Features

- **Complete Catalog API Coverage**: Implements all major Backstage Catalog API endpoints as MCP tools
- **Dynamic Tool Loading**: Automatically discovers and registers tools from the codebase
- **Type-Safe**: Full TypeScript support with Zod schema validation
- **Production Ready**: Built for reliability with proper error handling and logging
- **Enterprise Grade**: Cross-platform support with operational transparency and monitoring
- **Operational Transparency**: Comprehensive audit trails, health monitoring, and automated error recovery
- **Cross-Platform Compatibility**: Works seamlessly on Windows, macOS, and Linux
- **Advanced Build System**: Dual-format builds (ESM/CommonJS) with minification and tree-shaking

## Available Tools

### Entity Management

- `get_entity_by_ref` - Get a single entity by reference
- `get_entities` - Query entities with filters
- `get_entities_by_query` - Advanced entity querying with ordering
- `get_entities_by_refs` - Get multiple entities by references
- `get_entity_ancestors` - Get entity ancestry tree
- `get_entity_facets` - Get entity facet statistics

### Location Management

- `get_location_by_ref` - Get location by reference
- `get_location_by_entity` - Get location associated with an entity
- `add_location` - Create a new location
- `remove_location_by_id` - Delete a location

### Entity Operations

- `refresh_entity` - Trigger entity refresh
- `remove_entity_by_uid` - Delete entity by UID
- `validate_entity` - Validate entity structure

## Installation

### Prerequisites

- Node.js 18+
- Yarn 4.4.0+ (configured as packageManager)
- Access to a Backstage instance
- Cross-platform support: Windows (with MSYS/Cygwin), macOS, or Linux

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/Coderrob/backstage-mcp-server.git
   cd backstage-mcp-server
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Build and validate the project:

   ```bash
   yarn build:validate
   ```

   Or build manually:

   ```bash
   yarn build
   ```

4. (Optional) Run dependency analysis:

   ```bash
   yarn deps:analyze
   ```

## Configuration

The server requires environment variables for Backstage API access:

### Required Environment Variables

- `BACKSTAGE_BASE_URL` - Base URL of your Backstage instance (e.g., `https://backstage.example.com`)

### Authentication Configuration

Choose one of the following authentication methods:

- `BACKSTAGE_TOKEN` - Bearer token for API access
- `BACKSTAGE_CLIENT_ID`, `BACKSTAGE_CLIENT_SECRET`, `BACKSTAGE_TOKEN_URL` - OAuth credentials
- `BACKSTAGE_API_KEY` - API key authentication
- `BACKSTAGE_SERVICE_ACCOUNT_KEY` - Service account key

### Example Configuration

```bash
export BACKSTAGE_BASE_URL=https://backstage.example.com
export BACKSTAGE_TOKEN=your-auth-token-here
```

## Usage

### Starting the Server

```bash
yarn start
```

The server will start and listen for MCP protocol messages on stdin/stdout.

### Integration with MCP Clients

This server is designed to work with MCP-compatible clients. Configure your MCP client to use this server:

```json
{
  "mcpServers": {
    "backstage": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "BACKSTAGE_BASE_URL": "https://your-backstage-instance.com",
        "BACKSTAGE_TOKEN": "your-backstage-token"
      }
    }
  }
}
```

For global installation after NPM publishing:

```json
{
  "mcpServers": {
    "backstage": {
      "command": "backstage-mcp-server",
      "env": {
        "BACKSTAGE_BASE_URL": "https://your-backstage-instance.com",
        "BACKSTAGE_TOKEN": "your-backstage-token"
      }
    }
  }
}
```

### Example Usage with LLMs

Once connected, LLMs can use natural language to interact with Backstage:

```text
User: "Show me all the services in the catalog"

LLM: Uses get_entities tool with appropriate filters

User: "What's the location for the user-service entity?"

LLM: Uses get_location_by_entity tool
```

## API Reference

### Tool Parameters

All tools accept parameters as defined by their Zod schemas. Entity references can be provided as:

- String: `"component:default/user-service"`
- Object: `{ kind: "component", namespace: "default", name: "user-service" }`

### Response Format

All tools return JSON responses with the following structure:

```json
{
  "status": "success" | "error",
  "data": <result>
}
```

## Development

### Project Structure

```text
src/
├── api/           # Backstage API client
├── auth/          # Authentication and security
├── cache/         # Caching layer
├── decorators/    # Tool decorators
├── tools/         # MCP tool implementations
├── types/         # Type definitions and constants
├── utils/         # Utility functions
└── index.ts       # Main server entry point

scripts/
├── validate-build.sh    # Build validation with operational transparency
├── dependency-manager.sh # Dependency analysis with cross-platform support
├── deps-crossplatform.sh         # Cross-platform dependency operations
├── monitor.sh                    # System monitoring and health checks
└── deps.sh                       # Legacy dependency scripts

docs/
├── OPERATIONAL_TRANSPARENCY.md   # Operational transparency documentation
├── DEPENDENCY_GUIDE.md          # Dependency management guide
├── EDGE_CASES_SUMMARY.md        # Edge cases and cross-platform considerations
└── BUILD_SETUP.md               # Build system documentation
```

### Building

```bash
yarn build
```

The build system uses Rollup to create optimized bundles for both CommonJS and ESM formats:

- `dist/index.cjs` - CommonJS bundle with shebang for CLI usage
- `dist/index.mjs` - ESM bundle
- `dist/index.d.ts` - TypeScript declarations

#### Build Features

- **Dual Format Support**: Generates both CommonJS and ESM outputs for maximum compatibility
- **Minification**: All outputs are minified for production use with Terser
- **Source Maps**: Includes source maps for debugging
- **TypeScript Declarations**: Bundled .d.ts files for type safety
- **Global Installation**: The CommonJS build includes a shebang for global npm installation
- **Tree Shaking**: Removes unused code for smaller bundle sizes
- **Cross-Platform Builds**: Consistent builds across Windows, macOS, and Linux
- **Build Validation**: Automated validation with operational transparency
- **Error Recovery**: Automatic rollback on build failures

#### NPM Publishing

The package is configured for publishing to NPM with:

```bash
npm publish
```

After publishing, the server can be installed globally:

```bash
npm install -g @coderrob/backstage-mcp-server
backstage-mcp-server
```

## Operational Transparency & Enterprise Features

This MCP server includes comprehensive operational transparency and enterprise-grade features:

### Monitoring & Health Checks

- **Real-time Health Monitoring**: Continuous system health tracking
- **Resource Usage Tracking**: Memory, disk, and CPU monitoring
- **SLA Tracking**: Service Level Agreement monitoring and reporting
- **Automated Alerts**: Configurable alerting for critical conditions

### Build & Dependency Management

- **Cross-Platform Compatibility**: Consistent operation across Windows, macOS, and Linux
- **Dependency Analysis**: Comprehensive dependency conflict detection and resolution
- **Build Validation**: Automated build verification with rollback capabilities
- **Audit Trails**: Complete audit logging for all operations

### Error Recovery & Resilience

- **Network Resilience**: Automatic retry logic for network operations
- **Build Rollback**: Automatic rollback on build failures
- **Dependency Backup/Restore**: Backup and restore capabilities for dependencies
- **Structured Logging**: JSON-formatted logs with full context

### Usage Examples

#### Health Monitoring

```bash
# Check system health
yarn monitor:health

# View monitoring dashboard
yarn monitor:dashboard

# Check alerts
yarn monitor:alerts
```

#### Dependency Management

```bash
# Analyze dependencies
yarn deps:analyze

# Validate dependency health
yarn deps:validate

# Cross-platform dependency operations
yarn deps:crossplatform
```

#### Build Validation

```bash
# Comprehensive build validation
yarn build:validate

# Development build
yarn build:dev

# Watch mode
yarn build:watch
```

### Testing

```bash
yarn test
```

### Linting

```bash
yarn lint
```

### Adding New Tools

1. Create a new tool file in `src/tools/`
2. Implement the tool class with `@Tool` decorator
3. Export from `src/tools/index.ts`
4. Define Zod schema for parameters

Example:

```typescript
@Tool({
  name: 'my_tool',
  description: 'Description of my tool',
  paramsSchema: z.object({ param: z.string() }),
})
export class MyTool {
  static async execute({ param }, context) {
    // Implementation
    return JsonToTextResponse({ status: 'success', data: result });
  }
}
```

## Contributing

We welcome contributions! Please see our contribution guidelines and ensure all changes include appropriate tests.

1. Fork the repository
2. Create a feature branch
3. Make your changes with comprehensive testing
4. Run the full validation suite: `yarn build:validate && yarn deps:analyze`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Documentation

- [Operational Transparency Guide](OPERATIONAL_TRANSPARENCY.md)
- [Dependency Management Guide](DEPENDENCY_GUIDE.md)
- [Build System Documentation](BUILD_SETUP.md)
- [Edge Cases & Cross-Platform](EDGE_CASES_SUMMARY.md)

## Related Projects

- [Backstage](https://backstage.io/) - The platform this server integrates with
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [Backstage Catalog Client](https://github.com/backstage/backstage/tree/master/packages/catalog-client) - Official Backstage client library

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client(
  {
    name: 'example-client',
    version: '1.0.0',
  },
  {
    capabilities: {},
  }
);

// Connect to the Backstage MCP server
await client.connect(new StdioServerTransport(process));

// List available tools
const tools = await client.request({ method: 'tools/list' });
console.log('Available tools:', tools);

// Call a tool
const result = await client.request({
  method: 'tools/call',
  params: {
    name: 'get_entity_by_ref',
    arguments: {
      entityRef: 'component:default/my-component',
    },
  },
});
console.log('Tool result:', result);
```
