/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { backstageCatalogPlugin, type BackstageMcpContext } from './backstage/backstage.plugin.js';
import { BackstageCatalogApi } from './backstage/api/backstage-catalog-api.js';
import { createMcpServer, type McpApplication } from './mcp/application.js';
import { requestLogging } from './mcp/middleware.js';
import { type McpTransportFactory, stdioTransport } from './mcp/transports.js';
import { ConfigurationError } from './shared/errors/error-handling.js';
import { createStderrLogger, type Logger, LogLevel } from './shared/logging/logger.js';
import { isNonEmptyString } from './shared/validation/guards.js';
import type { IAuthConfig, IBackstageCatalogApi } from './types/index.js';

/** Optional dependency and environment overrides for a Backstage MCP application. */
export interface BackstageServerOptions {
  env?: NodeJS.ProcessEnv;
  logger?: Logger;
  catalogClient?: IBackstageCatalogApi;
  transport?: McpTransportFactory;
}

/**
 * Resolves the bearer credential used for Backstage external access.
 * @param env - Environment variables containing Backstage credentials.
 * @returns Validated bearer authentication configuration.
 * @throws {ConfigurationError} When no Backstage token source is configured.
 */
export function buildAuthConfig(env: Readonly<NodeJS.ProcessEnv> = process.env): IAuthConfig {
  const tokenFile = env.BACKSTAGE_TOKEN_FILE;
  if (isNonEmptyString(tokenFile)) return { type: 'bearer', tokenFile };
  const token = env.BACKSTAGE_TOKEN;
  if (isNonEmptyString(token)) return { type: 'bearer', token };
  throw new ConfigurationError('BACKSTAGE_TOKEN or BACKSTAGE_TOKEN_FILE is required for Backstage external access');
}

/**
 * Creates a side-effect-free Backstage MCP application.
 * @param options - Optional environment, logger, and catalog-client overrides.
 * @returns A configured application that has not started a transport.
 */
export function createBackstageServer(
  options: Readonly<BackstageServerOptions> = {}
): McpApplication<BackstageMcpContext> {
  const env = options.env ?? process.env;
  const logger =
    options.logger ?? createStderrLogger(env.LOG_LEVEL === LogLevel.DEBUG ? LogLevel.DEBUG : LogLevel.INFO);

  return createMcpServer<BackstageMcpContext>({
    identity: { name: 'backstage-mcp-server', version: '2.0.0' },
    instructions: 'Use these tools to inspect and update the configured Backstage software catalog.',
    plugins: [backstageCatalogPlugin],
    logger,
    middleware: [requestLogging(logger)],
    defaultTimeoutMs: 30_000,
    /**
     * Creates the typed Backstage context when the application starts.
     * @returns The catalog dependency used by tool handlers.
     */
    createContext: () => ({ catalogClient: options.catalogClient ?? createCatalogClient(env) }),
  });
}

/**
 * Creates the authenticated HTTP-backed Backstage catalog adapter.
 * @param env - Environment variables containing the base URL and credentials.
 * @returns A catalog API implementation for the application context.
 * @throws {ConfigurationError} When the Backstage base URL is missing.
 */
function createCatalogClient(env: Readonly<NodeJS.ProcessEnv>): IBackstageCatalogApi {
  const baseUrl = env.BACKSTAGE_BASE_URL;
  if (!isNonEmptyString(baseUrl)) {
    throw new ConfigurationError('BACKSTAGE_BASE_URL environment variable is required');
  }
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  return new BackstageCatalogApi({ baseUrl: normalizedBaseUrl, auth: buildAuthConfig(env) });
}

/**
 * Creates and starts the Backstage MCP application over stdio.
 * @param options - Optional environment, logger, and catalog-client overrides.
 * @returns The running application so its lifecycle can be managed by the caller.
 */
export async function startServer(
  options: Readonly<BackstageServerOptions> = {}
): Promise<McpApplication<BackstageMcpContext>> {
  const app = createBackstageServer(options);
  await app.start(options.transport ?? stdioTransport());
  return app;
}
