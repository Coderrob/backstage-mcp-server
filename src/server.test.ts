/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { defineTransport } from './mcp/transports.js';
import { ConfigurationError } from './shared/errors/error-handling.js';
import { noopLogger } from './shared/logging/logger.js';
import { buildAuthConfig, createBackstageServer, startServer } from './server.js';
import type { IBackstageCatalogApi } from './types/index.js';

const catalogClient = {} as IBackstageCatalogApi;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Backstage server composition', () => {
  it('should validate external-access authentication configuration', () => {
    expect(buildAuthConfig({ BACKSTAGE_TOKEN: 'token' })).toEqual({ type: 'bearer', token: 'token' });
    expect(buildAuthConfig({ BACKSTAGE_TOKEN_FILE: '/run/secrets/backstage-token' })).toEqual({
      type: 'bearer',
      tokenFile: '/run/secrets/backstage-token',
    });
    expect(buildAuthConfig({ BACKSTAGE_TOKEN: 'static-token', BACKSTAGE_TOKEN_FILE: '/run/secrets/token' })).toEqual({
      type: 'bearer',
      tokenFile: '/run/secrets/token',
    });
    expect(() => buildAuthConfig({})).toThrow(ConfigurationError);
    vi.stubEnv('BACKSTAGE_TOKEN', 'process-token');
    expect(buildAuthConfig()).toEqual({ type: 'bearer', token: 'process-token' });
  });

  it('should create a side-effect-free application with injected dependencies', () => {
    const app = createBackstageServer({ catalogClient, logger: noopLogger, env: {} });
    expect(app.state).toBe('created');
    expect(app.manifest().features).toHaveLength(3);
    expect(createBackstageServer({ catalogClient, env: { LOG_LEVEL: 'debug' } }).state).toBe('created');
    expect(createBackstageServer({ catalogClient, logger: noopLogger }).state).toBe('created');
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
    expect((await client.listTools()).tools).toHaveLength(3);
    await client.close();
    await app.stop('test-complete');
  });

  it('should default to the stdio transport when no factory is injected', async () => {
    const app = await startServer({ catalogClient, logger: noopLogger, env: {} });
    expect(app.state).toBe('running');
    await app.stop('stdio-test-complete');
  });
});
