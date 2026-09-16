/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { McpErrorCode, McpNotFoundError } from '../../mcp/errors.js';
import { CatalogResultStatus, CatalogSortOrder } from '../../shared/constants/backstage-catalog.js';
import {
  catalogOptionalResult,
  catalogResult,
  queryEntitiesInputSchema,
  toCatalogMcpError,
  toEntityRef,
  toQueryEntitiesRequest,
} from './shared.js';

describe('Catalog tool support', () => {
  it('should converts both supported entity-reference forms', () => {
    expect(toEntityRef('component:default/api')).toBe('component:default/api');
    expect(toEntityRef({ kind: 'Component', namespace: 'default', name: 'api' })).toBe('Component:default/api');
  });

  it('should builds initial, legacy-order, and cursor query requests', () => {
    expect(toQueryEntitiesRequest(queryEntitiesInputSchema.parse({ limit: 2 }))).toEqual({ limit: 2 });
    expect(toQueryEntitiesRequest(queryEntitiesInputSchema.parse({ order: { field: 'metadata.name' } }))).toEqual({
      orderFields: { field: 'metadata.name', order: CatalogSortOrder.ASCENDING },
    });
    expect(
      toQueryEntitiesRequest(
        queryEntitiesInputSchema.parse({
          order: { field: 'metadata.name', order: CatalogSortOrder.DESCENDING },
          orderFields: { field: 'kind', order: CatalogSortOrder.ASCENDING },
        })
      )
    ).toEqual({ orderFields: { field: 'kind', order: CatalogSortOrder.ASCENDING } });
    expect(toQueryEntitiesRequest(queryEntitiesInputSchema.parse({ cursor: 'next', offset: 20 }))).toEqual({
      cursor: 'next',
    });
  });

  it('should creates success envelopes with and without data', async () => {
    await expect(catalogResult(Promise.resolve({ value: 1 }), 'failure')).resolves.toMatchObject({
      structuredContent: { status: CatalogResultStatus.SUCCESS, data: { value: 1 } },
    });
    await expect(catalogResult(Promise.resolve(undefined), 'failure')).resolves.toMatchObject({
      structuredContent: { status: CatalogResultStatus.SUCCESS },
    });
  });

  it('should creates optional success and typed absence results', async () => {
    await expect(catalogOptionalResult(Promise.resolve('value'), 'Thing', 'one', 'failure')).resolves.toMatchObject({
      structuredContent: { status: CatalogResultStatus.SUCCESS, data: 'value' },
    });
    await expect(catalogOptionalResult(Promise.resolve(undefined), 'Thing', 'one', 'failure')).rejects.toBeInstanceOf(
      McpNotFoundError
    );
  });

  it('should maps malformed and status-less failures to an upstream error', async () => {
    expect(toCatalogMcpError(null, 'safe')).toMatchObject({ code: McpErrorCode.UPSTREAM_ERROR, message: 'safe' });
    expect(toCatalogMcpError({ statusCode: 'bad' }, 'safe')).toMatchObject({ code: McpErrorCode.UPSTREAM_ERROR });
    await expect(catalogResult(Promise.reject(new Error('network')), 'safe')).rejects.toMatchObject({
      code: McpErrorCode.UPSTREAM_ERROR,
    });
    await expect(
      catalogOptionalResult(Promise.reject({ statusCode: 403 }), 'Thing', 'one', 'safe')
    ).rejects.toMatchObject({ code: McpErrorCode.INSUFFICIENT_PERMISSIONS });
  });
});
