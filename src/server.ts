import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { join } from 'path';

import { BackstageCatalogApi } from './api/backstage-catalog-api.js';
import { AuthConfig } from './types/auth.js';
import { IToolRegistrationContext } from './types/tools.js';
import { isNonEmptyString } from './utils/core/guards.js';
import { logger } from './utils/core/logger.js';
import { ConfigurationError } from './utils/errors/custom-errors.js';
import { withErrorHandling } from './utils/errors/error-handler.js';
import { registerBuiltInHealthChecks } from './utils/health/built-in-checks.js';
import { DefaultToolFactory } from './utils/tools/tool-factory.js';
import { ToolLoader } from './utils/tools/tool-loader.js';
import { ReflectToolMetadataProvider } from './utils/tools/tool-metadata.js';
import { DefaultToolRegistrar } from './utils/tools/tool-registrar.js';
import { DefaultToolValidator } from './utils/tools/tool-validator.js';

/**
 * Starts the Backstage MCP Server with all necessary components.
 * Initializes health checks, authentication, MCP server, and tool registration.
 * @returns Promise that resolves when server is fully started
 * @throws ConfigurationError if required environment variables are missing
 */
export async function startServer(): Promise<void> {
  await withErrorHandling('server-startup', async () => {
    logger.info('Starting Backstage MCP Server');

    registerBuiltInHealthChecks();

    const configDir = process.cwd();

    const baseUrl = process.env.BACKSTAGE_BASE_URL;
    if (!isNonEmptyString(baseUrl)) {
      logger.error('BACKSTAGE_BASE_URL environment variable is required');
      throw new ConfigurationError('BACKSTAGE_BASE_URL environment variable is required');
    }

    logger.debug('Building authentication configuration');
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
      new DefaultToolFactory(),
      new DefaultToolRegistrar(context),
      new DefaultToolValidator(),
      new ReflectToolMetadataProvider()
    );

    await toolLoader.registerAll();

    if (process.env.NODE_ENV !== 'production') {
      logger.info('Exporting tools manifest for development');
      await toolLoader.exportManifest(join(configDir, '..', 'tools-manifest.json'));
    }

    logger.debug('Setting up transport and connecting server');
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('Backstage MCP Server started successfully');
  });
}

/**
 * Builds authentication configuration from environment variables.
 * Supports multiple authentication methods: bearer token, OAuth, API key, and service account.
 * @returns Authentication configuration object
 * @throws ConfigurationError if no valid authentication configuration is found
 */
export function buildAuthConfig(): AuthConfig {
  const token = process.env.BACKSTAGE_TOKEN;
  const clientId = process.env.BACKSTAGE_CLIENT_ID;
  const clientSecret = process.env.BACKSTAGE_CLIENT_SECRET;
  const tokenUrl = process.env.BACKSTAGE_TOKEN_URL;
  const apiKey = process.env.BACKSTAGE_API_KEY;
  const serviceAccountKey = process.env.BACKSTAGE_SERVICE_ACCOUNT_KEY;

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

  throw new ConfigurationError(
    'No valid authentication configuration found. Please set one of:\n' +
      '- BACKSTAGE_TOKEN (for bearer token auth)\n' +
      '- BACKSTAGE_CLIENT_ID, BACKSTAGE_CLIENT_SECRET, BACKSTAGE_TOKEN_URL (for OAuth)\n' +
      '- BACKSTAGE_API_KEY (for API key auth)\n' +
      '- BACKSTAGE_SERVICE_ACCOUNT_KEY (for service account auth)'
  );
}
