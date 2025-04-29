import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BackstageCatalogApi } from './api/backstage-catalog-api';
import { IToolRegistrationContext } from './types';
import { ToolLoader } from './utils/tool-loader';

export async function startServer(): Promise<void> {
  const server = new McpServer({
    name: 'Backstage MCP Server',
    version: '1.0.0',
  });

  const context: IToolRegistrationContext = {
    server,
    catalogClient: new BackstageCatalogApi({ baseUrl: '' }),
  };

  const toolLoader = new ToolLoader('./tools', context);
  await toolLoader.registerAllTools();

  if (process.env.NODE_ENV !== 'production') {
    await toolLoader.exportManifest('./tools-manifest.json');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
