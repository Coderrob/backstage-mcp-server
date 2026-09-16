/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';

import { McpErrorCode } from '../mcp/errors.js';
import { connectTestClient } from '../mcp/testing.js';
import { createBackstageServer } from '../server.js';
import { noopLogger } from '../shared/logging/logger.js';
import type { IBackstageCatalogApi } from '../types/index.js';

const METADATA_NAME_FIELD = 'metadata.name';

/**
 * Creates a typed Backstage client fake and exposes its spies for assertions.
 * @returns A catalog client and its operation spies.
 */
function createCatalogFake(): {
  client: IBackstageCatalogApi;
  queryEntities: Mock;
  getEntityByRef: Mock;
  addLocation: Mock;
} {
  const queryEntities = vi.fn(async () => ({ items: [], totalItems: 0, pageInfo: {} }));
  const getEntityByRef = vi.fn(async () => ({
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name: 'example', namespace: 'default' },
  }));
  const addLocation = vi.fn(async () => ({
    location: { id: 'location-1', type: 'url', target: 'https://example.test/catalog-info.yaml' },
    entities: [],
  }));
  return {
    client: { queryEntities, getEntityByRef, addLocation } as unknown as IBackstageCatalogApi,
    queryEntities,
    getEntityByRef,
    addLocation,
  };
}

describe('Backstage MCP plugin', () => {
  it('should publish only implemented tools and forward validated arguments', async () => {
    const fake = createCatalogFake();
    const app = createBackstageServer({ catalogClient: fake.client, logger: noopLogger });
    expect(app.manifest().features.map(({ name }) => name)).toEqual([
      'add_location',
      'get_entities',
      'get_entity_by_ref',
    ]);

    const connection = await connectTestClient(app);
    try {
      const listed = await connection.client.listTools();
      expect(listed.tools.map(({ name }) => name)).toEqual(['add_location', 'get_entities', 'get_entity_by_ref']);

      await connection.client.callTool({
        name: 'get_entities',
        arguments: {
          filter: { kind: 'Component' },
          orderFields: { field: METADATA_NAME_FIELD, order: 'asc' },
          fullTextFilter: { term: 'example', fields: [METADATA_NAME_FIELD] },
          limit: 10,
        },
      });
      expect(fake.queryEntities).toHaveBeenCalledWith({
        filter: { kind: 'Component' },
        orderFields: { field: METADATA_NAME_FIELD, order: 'asc' },
        fullTextFilter: { term: 'example', fields: [METADATA_NAME_FIELD] },
        limit: 10,
      });

      const entity = await connection.client.callTool({
        name: 'get_entity_by_ref',
        arguments: { entityRef: { kind: 'Component', namespace: 'default', name: 'example' } },
      });
      expect(fake.getEntityByRef).toHaveBeenCalledWith('Component:default/example');
      expect(entity.structuredContent).toMatchObject({ status: 'success', data: { kind: 'Component' } });

      await connection.client.callTool({
        name: 'add_location',
        arguments: {
          target: 'https://example.test/catalog-info.yaml',
          type: 'url',
          dryRun: true,
          onConflict: 'refresh',
        },
      });
      expect(fake.addLocation).toHaveBeenCalledWith({
        target: 'https://example.test/catalog-info.yaml',
        type: 'url',
        dryRun: true,
        onConflict: 'refresh',
      });
    } finally {
      await connection.close();
    }
  });

  it('should preserve Backstage authentication and conflict semantics in MCP errors', async () => {
    const fake = createCatalogFake();
    fake.queryEntities.mockRejectedValueOnce({ statusCode: 401 });
    fake.addLocation.mockRejectedValueOnce({ statusCode: 409 });
    const app = createBackstageServer({ catalogClient: fake.client, logger: noopLogger });
    const connection = await connectTestClient(app);
    try {
      const unauthenticated = await connection.client.callTool({ name: 'get_entities', arguments: {} });
      expect(unauthenticated).toMatchObject({
        isError: true,
        structuredContent: {
          error: { code: McpErrorCode.AUTHENTICATION_REQUIRED, details: { statusCode: 401 } },
        },
      });

      const conflict = await connection.client.callTool({
        name: 'add_location',
        arguments: { target: 'https://example.test/catalog-info.yaml' },
      });
      expect(conflict).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.CONFLICT, details: { statusCode: 409 } } },
      });
    } finally {
      await connection.close();
    }
  });

  it('should issue cursor-only queries and return typed not-found results', async () => {
    const fake = createCatalogFake();
    fake.getEntityByRef.mockResolvedValueOnce(undefined);
    const app = createBackstageServer({ catalogClient: fake.client, logger: noopLogger });
    const connection = await connectTestClient(app);
    try {
      await connection.client.callTool({
        name: 'get_entities',
        arguments: {
          cursor: 'next-page',
          fields: [METADATA_NAME_FIELD],
          limit: 5,
          filter: { kind: 'Component' },
          offset: 10,
        },
      });
      expect(fake.queryEntities).toHaveBeenCalledWith({
        cursor: 'next-page',
        fields: [METADATA_NAME_FIELD],
        limit: 5,
      });
      const missing = await connection.client.callTool({
        name: 'get_entity_by_ref',
        arguments: { entityRef: 'component:default/missing' },
      });
      expect(missing).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.NOT_FOUND } },
      });
    } finally {
      await connection.close();
    }
  });

  it.each([
    [403, McpErrorCode.INSUFFICIENT_PERMISSIONS],
    [429, McpErrorCode.RATE_LIMITED],
    [500, McpErrorCode.UPSTREAM_ERROR],
  ])('should map Backstage status %i to %s', async (statusCode, code) => {
    const fake = createCatalogFake();
    fake.queryEntities.mockRejectedValueOnce({ statusCode });
    const app = createBackstageServer({ catalogClient: fake.client, logger: noopLogger });
    const connection = await connectTestClient(app);
    try {
      const result = await connection.client.callTool({ name: 'get_entities', arguments: {} });
      expect(result).toMatchObject({ isError: true, structuredContent: { error: { code } } });
    } finally {
      await connection.close();
    }
  });

  it('should map entity lookup and status-less failures to upstream errors', async () => {
    const fake = createCatalogFake();
    fake.getEntityByRef.mockRejectedValueOnce(new Error('network'));
    fake.queryEntities.mockRejectedValueOnce('connection closed');
    const app = createBackstageServer({ catalogClient: fake.client, logger: noopLogger });
    const connection = await connectTestClient(app);
    try {
      const entity = await connection.client.callTool({
        name: 'get_entity_by_ref',
        arguments: { entityRef: 'component:default/api' },
      });
      const query = await connection.client.callTool({ name: 'get_entities', arguments: {} });
      expect(entity).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.UPSTREAM_ERROR } },
      });
      expect(query).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.UPSTREAM_ERROR } },
      });
    } finally {
      await connection.close();
    }
  });

  it('should ignore a nonnumeric upstream status value', async () => {
    const fake = createCatalogFake();
    fake.queryEntities.mockRejectedValueOnce({ statusCode: 'unavailable' });
    const app = createBackstageServer({ catalogClient: fake.client, logger: noopLogger });
    const connection = await connectTestClient(app);
    try {
      const result = await connection.client.callTool({ name: 'get_entities', arguments: {} });
      expect(result).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.UPSTREAM_ERROR } },
      });
    } finally {
      await connection.close();
    }
  });
});
