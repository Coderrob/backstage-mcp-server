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

import { BackstageCatalogApi } from './backstage/api/backstage-catalog-api.js';
import { backstageCatalogPlugin, type BackstageMcpContext } from './backstage/backstage.plugin.js';
import { createMcpServer, type McpApplication } from './mcp/application.js';
import { requestLogging } from './mcp/middleware.js';
import { stdioTransport } from './mcp/transports.js';
import {
  AuthType,
  BACKSTAGE_MCP_SERVER_NAME,
  BACKSTAGE_MCP_SERVER_VERSION,
  BackstageEnvironmentVariable,
  CATALOG_OPERATION_TIMEOUT_MS,
} from './shared/constants/backstage-catalog.js';
import { ConfigurationError } from './shared/errors/error-handling.js';
import { createStderrLogger, LogLevel } from './shared/logging/logger.js';
import { isNonEmptyString } from './shared/validation/guards.js';
import type { BackstageServerOptions, IAuthConfig, IBackstageCatalogApi } from './types/index.js';

export type { BackstageServerOptions } from './types/backstage.js';

/**
 * Resolves the bearer credential used for Backstage external access.
 * @param env - Environment variables containing Backstage credentials.
 * @returns Validated bearer authentication configuration.
 * @throws {ConfigurationError} When no Backstage token source is configured.
 */
export function buildAuthConfig(env: Readonly<NodeJS.ProcessEnv> = process.env): IAuthConfig {
  const tokenFile = env[BackstageEnvironmentVariable.TOKEN_FILE];
  if (isNonEmptyString(tokenFile)) return { type: AuthType.BEARER, tokenFile };
  const token = env[BackstageEnvironmentVariable.TOKEN];
  if (isNonEmptyString(token)) return { type: AuthType.BEARER, token };
  throw new ConfigurationError(
    `${BackstageEnvironmentVariable.TOKEN} or ${BackstageEnvironmentVariable.TOKEN_FILE} is required for Backstage external access`
  );
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
    options.logger ??
    createStderrLogger(env[BackstageEnvironmentVariable.LOG_LEVEL] === LogLevel.DEBUG ? LogLevel.DEBUG : LogLevel.INFO);

  return createMcpServer<BackstageMcpContext>({
    identity: { name: BACKSTAGE_MCP_SERVER_NAME, version: BACKSTAGE_MCP_SERVER_VERSION },
    instructions: 'Use these tools to inspect and update the configured Backstage software catalog.',
    plugins: [backstageCatalogPlugin],
    logger,
    middleware: [requestLogging(logger)],
    defaultTimeoutMs: CATALOG_OPERATION_TIMEOUT_MS,
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
  const baseUrl = env[BackstageEnvironmentVariable.BASE_URL];
  if (!isNonEmptyString(baseUrl)) {
    throw new ConfigurationError(`${BackstageEnvironmentVariable.BASE_URL} environment variable is required`);
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
