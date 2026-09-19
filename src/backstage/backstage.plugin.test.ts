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

import type { ValidateEntityResponse } from '@backstage/catalog-client';
import { connectTestClient, McpErrorCode, noopLogger } from '@coderrob/mcp-kernel';
import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';

import { createBackstageServer } from '../server.js';
import { BackstageToolName } from '../shared/constants/backstage-catalog.js';
import type { IBackstageCatalogApi } from '../types/backstage.js';
import type { ICatalogApiFixture } from '../types/backstage-testing.js';
import { getEntitiesInputSchema } from './backstage.plugin.js';

const EXPECTED_TOOLS = Object.values(BackstageToolName);
const RESOLVED_ENTITY_REF = 'Component:default/api';
const LOCATION_ID = 'location-1';
const TEST_TARGET = 'test';

/** Creates a complete official Catalog client test double. */
function createCatalogApiFixture(): ICatalogApiFixture<Readonly<Record<string, Mock>>> {
  const operations = {
    addLocation: vi.fn(async () => ({
      location: { id: LOCATION_ID, type: 'url', target: TEST_TARGET, entityRef: RESOLVED_ENTITY_REF },
      entities: [],
    })),
    getEntitiesByRefs: vi.fn(async () => ({ items: [] })),
    getEntityAncestors: vi.fn(async () => ({ rootEntityRef: 'component:default/api', items: [] })),
    getEntityByRef: vi.fn(async () => ({ apiVersion: 'v1', kind: 'Component', metadata: { name: 'api' } })),
    getEntityFacets: vi.fn(async () => ({ facets: {} })),
    getLocationByEntity: vi.fn(async () => ({
      id: LOCATION_ID,
      type: 'url',
      target: TEST_TARGET,
      entityRef: RESOLVED_ENTITY_REF,
    })),
    getLocationById: vi.fn(async () => undefined),
    getLocationByRef: vi.fn(async () => ({
      id: LOCATION_ID,
      type: 'url',
      target: TEST_TARGET,
      entityRef: RESOLVED_ENTITY_REF,
    })),
    queryEntities: vi.fn(async () => ({ items: [], totalItems: 0, pageInfo: {} })),
    refreshEntity: vi.fn(async () => undefined),
    removeEntityByUid: vi.fn(async () => undefined),
    removeLocationById: vi.fn(async () => undefined),
    validateEntity: vi.fn(async (): Promise<ValidateEntityResponse> => ({ valid: true })),
  } satisfies IBackstageCatalogApi;
  return { client: operations, operations };
}

describe('Backstage MCP plugin', () => {
  it('should publish the complete historical tool surface', async () => {
    const fake = createCatalogApiFixture();
    const app = createBackstageServer({ catalogClient: fake.client, logger: noopLogger });
    expect(app.manifest().features.map(({ name }) => name)).toEqual(EXPECTED_TOOLS);
    const connection = await connectTestClient(app);
    try {
      expect((await connection.client.listTools()).tools.map(({ name }) => name)).toEqual(EXPECTED_TOOLS);
    } finally {
      await connection.close();
    }
  });

  it('should forward every tool through the typed Catalog context', async () => {
    const fake = createCatalogApiFixture();
    const app = createBackstageServer({ catalogClient: fake.client, logger: noopLogger });
    const connection = await connectTestClient(app);
    const entityRef = { kind: 'Component', namespace: 'default', name: 'api' };
    try {
      await connection.client.callTool({ name: 'add_location', arguments: { target: TEST_TARGET, dryRun: true } });
      await connection.client.callTool({ name: 'get_entities', arguments: { limit: 10 } });
      await connection.client.callTool({
        name: 'get_entities_by_query',
        arguments: { order: { field: 'metadata.name' } },
      });
      await connection.client.callTool({ name: 'get_entities_by_refs', arguments: { entityRefs: [entityRef] } });
      await connection.client.callTool({ name: 'get_entity_ancestors', arguments: { entityRef } });
      await connection.client.callTool({ name: 'get_entity_by_ref', arguments: { entityRef } });
      await connection.client.callTool({ name: 'get_entity_facets', arguments: { facets: ['kind'] } });
      await connection.client.callTool({ name: 'get_location_by_entity', arguments: { entityRef } });
      await connection.client.callTool({ name: 'get_location_by_ref', arguments: { locationRef: 'url:test' } });
      await connection.client.callTool({ name: 'refresh_entity', arguments: { entityRef } });
      await connection.client.callTool({
        name: 'remove_entity_by_uid',
        arguments: { uid: '123e4567-e89b-12d3-a456-426614174000' },
      });
      await connection.client.callTool({ name: 'remove_location_by_id', arguments: { locationId: LOCATION_ID } });
      await connection.client.callTool({
        name: 'validate_entity',
        arguments: {
          entity: { apiVersion: 'v1', kind: 'Component', metadata: { name: 'api' } },
          locationRef: 'url:test',
        },
      });

      expect(fake.operations.addLocation).toHaveBeenCalledWith({ target: TEST_TARGET, dryRun: true });
      expect(fake.operations.queryEntities).toHaveBeenNthCalledWith(1, { limit: 10 });
      expect(fake.operations.queryEntities).toHaveBeenNthCalledWith(2, {
        orderFields: { field: 'metadata.name', order: 'asc' },
      });
      expect(fake.operations.getEntitiesByRefs).toHaveBeenCalledWith({
        entityRefs: [RESOLVED_ENTITY_REF],
      });
      expect(fake.operations.getEntityAncestors).toHaveBeenCalledWith({ entityRef: RESOLVED_ENTITY_REF });
      expect(fake.operations.getEntityByRef).toHaveBeenCalledWith(RESOLVED_ENTITY_REF);
      expect(fake.operations.getEntityFacets).toHaveBeenCalledWith({ facets: ['kind'] });
      expect(fake.operations.getLocationByEntity).toHaveBeenCalledWith(RESOLVED_ENTITY_REF);
      expect(fake.operations.getLocationByRef).toHaveBeenCalledWith('url:test');
      expect(fake.operations.refreshEntity).toHaveBeenCalledWith(RESOLVED_ENTITY_REF);
      expect(fake.operations.removeEntityByUid).toHaveBeenCalledOnce();
      expect(fake.operations.removeLocationById).toHaveBeenCalledWith(LOCATION_ID);
      expect(fake.operations.validateEntity).toHaveBeenCalledOnce();
    } finally {
      await connection.close();
    }
  });

  it('should preserve cursor semantics and reject empty filters', async () => {
    expect(getEntitiesInputSchema.safeParse({ filter: {} }).success).toBe(false);
    expect(getEntitiesInputSchema.safeParse({ filter: [] }).success).toBe(false);
    const fake = createCatalogApiFixture();
    const connection = await connectTestClient(
      createBackstageServer({ catalogClient: fake.client, logger: noopLogger })
    );
    try {
      await connection.client.callTool({
        name: 'get_entities',
        arguments: { cursor: 'next', fields: ['metadata.name'], limit: 5, offset: 2 },
      });
      expect(fake.operations.queryEntities).toHaveBeenCalledWith({
        cursor: 'next',
        fields: ['metadata.name'],
        limit: 5,
      });
    } finally {
      await connection.close();
    }
  });

  it.each([
    [401, McpErrorCode.AUTHENTICATION_REQUIRED],
    [403, McpErrorCode.INSUFFICIENT_PERMISSIONS],
    [409, McpErrorCode.CONFLICT],
    [429, McpErrorCode.RATE_LIMITED],
    [500, McpErrorCode.UPSTREAM_ERROR],
  ])('should map Catalog status %i to %s', async (statusCode, code) => {
    const fake = createCatalogApiFixture();
    fake.operations.queryEntities.mockRejectedValueOnce({ statusCode });
    const connection = await connectTestClient(
      createBackstageServer({ catalogClient: fake.client, logger: noopLogger })
    );
    try {
      const result = await connection.client.callTool({ name: 'get_entities', arguments: {} });
      expect(result).toMatchObject({ isError: true, structuredContent: { error: { code } } });
    } finally {
      await connection.close();
    }
  });

  it.each([
    ['get_entity_by_ref', 'getEntityByRef', { entityRef: 'component:default/missing' }],
    ['get_location_by_entity', 'getLocationByEntity', { entityRef: 'component:default/missing' }],
    ['get_location_by_ref', 'getLocationByRef', { locationRef: 'url:missing' }],
  ])('should return NOT_FOUND for absent optional result from %s', async (name, operationName, toolArguments) => {
    const fake = createCatalogApiFixture();
    fake.operations[operationName].mockResolvedValueOnce(undefined);
    const connection = await connectTestClient(
      createBackstageServer({ catalogClient: fake.client, logger: noopLogger })
    );
    try {
      const result = await connection.client.callTool({ name, arguments: toolArguments });
      expect(result).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.NOT_FOUND } },
      });
    } finally {
      await connection.close();
    }
  });
});
