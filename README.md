# Backstage MCP Server

A Model Context Protocol (MCP) server that exposes the Backstage Catalog API as tools for Large Language Models (LLMs). This allows LLMs to interact with Backstage software catalogs through a standardized protocol.

## Features

- **Complete Catalog API Coverage**: Implements all major Backstage Catalog API endpoints as MCP tools
- **Dynamic Tool Loading**: Automatically discovers and registers tools from the codebase
- **Type-Safe**: Full TypeScript support with Zod schema validation
- **Production Ready**: Built for reliability with proper error handling and logging

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
- Yarn package manager
- Access to a Backstage instance

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

3. Build the project:

   ```bash
   yarn build
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
├── decorators/    # Tool decorators
├── tools/         # MCP tool implementations
├── utils/         # Utility functions
└── types.ts       # Type definitions
```

### Building

```bash
yarn build
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

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Related Projects

- [Backstage](https://backstage.io/) - The platform this server integrates with
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification

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
