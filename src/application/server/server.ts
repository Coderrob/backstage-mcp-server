/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { join } from 'path';

import { registerBuiltInHealthChecks } from '../../domain/health/checks/register-builtIn.health-checks.js';
import { BackstageCatalogApi } from '../../infrastructure/api/backstage-catalog-api.js';
import { IAuthConfig } from '../../shared/types/auth.js';
import { ConfigurationError } from '../../shared/utils/custom-errors.js';
import { withErrorHandling } from '../../shared/utils/error-handler.js';
import { isNonEmptyString } from '../../shared/utils/guards.js';
import { logger } from '../../shared/utils/logger.js';
import { initializeToolPlugins } from '../bootstrap/tool-plugins.js';

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
      version: '2.0.0',
    });

    logger.debug('Initializing Backstage catalog client');
    const catalogClient = new BackstageCatalogApi({ baseUrl, auth: authConfig });

    logger.debug('Initializing plugin system and registering tools');
    const pluginRegistry = await initializeToolPlugins();
    const registeredTools = pluginRegistry.getPluginManager().getAllTools();

    logger.info(`Registered ${registeredTools.length} tools successfully`);

    // Register tools with MCP server
    for (const { tool, metadata } of registeredTools) {
      server.tool(
        metadata.name,
        metadata.description,
        {
          inputSchema: metadata.paramsSchema ? metadata.paramsSchema._def : undefined,
        },
        async (params) => {
          return tool.execute(params, { catalogClient });
        }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.info('Exporting tools manifest for development');
      // Generate a simple manifest for development
      const manifest = registeredTools.map(({ metadata }) => ({
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        tags: metadata.tags,
        version: metadata.version,
      }));

      const fs = await import('fs/promises');
      await fs.writeFile(join(configDir, '..', 'tools-manifest.json'), JSON.stringify(manifest, null, 2));
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
export function buildAuthConfig(): IAuthConfig {
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
