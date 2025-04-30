import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { IToolRegistrationContext } from './types';
import { BackstageCatalogApi } from './api/backstage-catalog-api';
import { ToolLoader } from './utils/tool-loader';
import { DefaultToolFactory } from './utils/tool-factory';
import { DefaultToolRegistrar } from './utils/tool-registrar';
import { DefaultToolValidator } from './utils/tool-validator';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ReflectToolMetadataProvider } from './utils/tool-metadata';

export async function startServer(): Promise<void> {
  const server = new McpServer({
    name: 'Backstage MCP Server',
    version: '1.0.0',
  });

  const context: IToolRegistrationContext = {
    server,
    catalogClient: new BackstageCatalogApi({ baseUrl: '' }),
  };

  const toolLoader = new ToolLoader(
    './tools',
    new DefaultToolFactory(),
    new DefaultToolRegistrar(context),
    new DefaultToolValidator(),
    new ReflectToolMetadataProvider()
  );

  await toolLoader.registerAll();

  if (process.env.NODE_ENV !== 'production') {
    await toolLoader.exportManifest('./tools-manifest.json');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
