import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { BackstageCatalogApi } from './api';
import { AuthConfig } from './auth/auth-manager';
import { IToolRegistrationContext } from './types';
import {
  DefaultToolFactory,
  DefaultToolRegistrar,
  DefaultToolValidator,
  isNonEmptyString,
  isString,
  logger,
  ReflectToolMetadataProvider,
  ToolLoader,
} from './utils';

export async function startServer(): Promise<void> {
  logger.info('Starting Backstage MCP Server');

  // ESM doesn't provide a __dirname variable - synthesize one from import.meta.url
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const baseUrl = process.env.BACKSTAGE_BASE_URL;
  if (!isString(baseUrl) || baseUrl.length === 0) {
    logger.error('BACKSTAGE_BASE_URL environment variable is required');
    throw new Error('BACKSTAGE_BASE_URL environment variable is required');
  }

  logger.debug('Building authentication configuration');
  // Build authentication configuration from environment variables
  const authConfig = buildAuthConfig();

  logger.debug('Creating MCP server instance');
  const server = new McpServer({
    name: 'Backstage MCP Server',
    version: '1.0.0',
  });

  logger.debug('Initializing Backstage catalog client');
  const context: IToolRegistrationContext = {
    server,
    catalogClient: new BackstageCatalogApi({ baseUrl, auth: authConfig }),
  };

  logger.debug('Loading and registering tools');
  const toolLoader = new ToolLoader(
    join(__dirname, 'tools'),
    new DefaultToolFactory(),
    new DefaultToolRegistrar(context),
    new DefaultToolValidator(),
    new ReflectToolMetadataProvider()
  );

  await toolLoader.registerAll();

  if (process.env.NODE_ENV !== 'production') {
    logger.info('Exporting tools manifest for development');
    await toolLoader.exportManifest(join(__dirname, '..', 'tools-manifest.json'));
  }

  logger.debug('Setting up transport and connecting server');
  // Create transport and connect
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Backstage MCP Server started successfully');
}

function buildAuthConfig(): AuthConfig {
  const token = process.env.BACKSTAGE_TOKEN;
  const clientId = process.env.BACKSTAGE_CLIENT_ID;
  const clientSecret = process.env.BACKSTAGE_CLIENT_SECRET;
  const tokenUrl = process.env.BACKSTAGE_TOKEN_URL;
  const apiKey = process.env.BACKSTAGE_API_KEY;
  const serviceAccountKey = process.env.BACKSTAGE_SERVICE_ACCOUNT_KEY;

  // Determine authentication type based on available environment variables
  if (isNonEmptyString(token)) {
    return { type: 'bearer', token };
  }
  if (isNonEmptyString(clientId) && isNonEmptyString(clientSecret) && isNonEmptyString(tokenUrl)) {
    return {
      type: 'oauth',
      clientId,
      clientSecret,
      tokenUrl,
    };
  }
  if (isNonEmptyString(apiKey)) {
    return { type: 'api-key', apiKey };
  }
  if (isNonEmptyString(serviceAccountKey)) {
    return { type: 'service-account', serviceAccountKey };
  }

  throw new Error(
    'No valid authentication configuration found. Please set one of:\n' +
      '- BACKSTAGE_TOKEN (for bearer token auth)\n' +
      '- BACKSTAGE_CLIENT_ID, BACKSTAGE_CLIENT_SECRET, BACKSTAGE_TOKEN_URL (for OAuth)\n' +
      '- BACKSTAGE_API_KEY (for API key auth)\n' +
      '- BACKSTAGE_SERVICE_ACCOUNT_KEY (for service account auth)'
  );
}
