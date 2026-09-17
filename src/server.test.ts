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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BackstageCatalogApi } from './backstage/api/backstage-catalog-api.js';
import { defineTransport } from './mcp/transports.js';
import { buildAuthConfig, createBackstageServer, startServer } from './server.js';
import { AuthType, BackstageToolName } from './shared/constants/backstage-catalog.js';
import { McpApplicationState } from './shared/constants/mcp-protocol.js';
import { ConfigurationError } from './shared/errors/error-handling.js';
import { noopLogger } from './shared/logging/logger.js';

const catalogClient = new BackstageCatalogApi({
  baseUrl: 'https://backstage.example.test',
  auth: { type: AuthType.BEARER, token: 'test-token' },
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Backstage server composition', () => {
  it('should validate external-access authentication configuration', () => {
    expect(buildAuthConfig({ BACKSTAGE_TOKEN: 'token' })).toEqual({ type: AuthType.BEARER, token: 'token' });
    expect(buildAuthConfig({ BACKSTAGE_TOKEN_FILE: '/run/secrets/backstage-token' })).toEqual({
      type: AuthType.BEARER,
      tokenFile: '/run/secrets/backstage-token',
    });
    expect(buildAuthConfig({ BACKSTAGE_TOKEN: 'static-token', BACKSTAGE_TOKEN_FILE: '/run/secrets/token' })).toEqual({
      type: AuthType.BEARER,
      tokenFile: '/run/secrets/token',
    });
    expect(() => buildAuthConfig({})).toThrow(ConfigurationError);
    vi.stubEnv('BACKSTAGE_TOKEN', 'process-token');
    expect(buildAuthConfig()).toEqual({ type: AuthType.BEARER, token: 'process-token' });
  });

  it('should create a side-effect-free application with injected dependencies', () => {
    const app = createBackstageServer({ catalogClient, logger: noopLogger, env: {} });
    expect(app.state).toBe(McpApplicationState.CREATED);
    expect(app.manifest().features).toHaveLength(Object.values(BackstageToolName).length);
    expect(createBackstageServer({ catalogClient, env: { LOG_LEVEL: 'debug' } }).state).toBe(
      McpApplicationState.CREATED
    );
    expect(createBackstageServer({ catalogClient, logger: noopLogger }).state).toBe(McpApplicationState.CREATED);
  });

  it('should reject missing URL and token when constructing the runtime context', async () => {
    const [, missingUrlTransport] = InMemoryTransport.createLinkedPair();
    const missingUrl = createBackstageServer({ logger: noopLogger, env: { BACKSTAGE_TOKEN: 'token' } });
    await expect(missingUrl.start(defineTransport('test', () => missingUrlTransport))).rejects.toThrow(
      /BACKSTAGE_BASE_URL/
    );

    const [, missingTokenTransport] = InMemoryTransport.createLinkedPair();
    const missingToken = createBackstageServer({
      logger: noopLogger,
      env: { BACKSTAGE_BASE_URL: 'https://example.test/' },
    });
    await expect(missingToken.start(defineTransport('test', () => missingTokenTransport))).rejects.toThrow(
      /BACKSTAGE_TOKEN/
    );
  });

  it('should start using an injected transport factory', async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const app = await startServer({
      catalogClient,
      logger: noopLogger,
      env: {},
      transport: defineTransport('test', () => serverTransport),
    });
    const client = new Client({ name: 'server-test', version: '1.0.0' });
    await client.connect(clientTransport);
    expect((await client.listTools()).tools).toHaveLength(Object.values(BackstageToolName).length);
    await client.close();
    await app.stop('test-complete');
  });

  it('should default to the stdio transport when no factory is injected', async () => {
    const app = await startServer({ catalogClient, logger: noopLogger, env: {} });
    expect(app.state).toBe(McpApplicationState.RUNNING);
    await app.stop('stdio-test-complete');
  });
});
