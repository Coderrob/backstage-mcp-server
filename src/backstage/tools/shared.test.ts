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
  it('should convert both supported entity-reference forms', () => {
    expect(toEntityRef('component:default/api')).toBe('component:default/api');
    expect(toEntityRef({ kind: 'Component', namespace: 'default', name: 'api' })).toBe('Component:default/api');
  });

  it('should build initial, legacy-order, and cursor query requests', () => {
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

  it('should create success envelopes with and without data', async () => {
    await expect(catalogResult(Promise.resolve({ value: 1 }), 'failure')).resolves.toMatchObject({
      structuredContent: { status: CatalogResultStatus.SUCCESS, data: { value: 1 } },
    });
    await expect(catalogResult(Promise.resolve(undefined), 'failure')).resolves.toMatchObject({
      structuredContent: { status: CatalogResultStatus.SUCCESS },
    });
  });

  it('should create optional success and typed absence results', async () => {
    await expect(catalogOptionalResult(Promise.resolve('value'), 'Thing', 'one', 'failure')).resolves.toMatchObject({
      structuredContent: { status: CatalogResultStatus.SUCCESS, data: 'value' },
    });
    await expect(catalogOptionalResult(Promise.resolve(undefined), 'Thing', 'one', 'failure')).rejects.toBeInstanceOf(
      McpNotFoundError
    );
  });

  it('should map malformed and status-less failures to an upstream error', async () => {
    expect(toCatalogMcpError(null, 'safe')).toMatchObject({ code: McpErrorCode.UPSTREAM_ERROR, message: 'safe' });
    expect(toCatalogMcpError({ statusCode: 'bad' }, 'safe')).toMatchObject({ code: McpErrorCode.UPSTREAM_ERROR });
    await expect(catalogResult(Promise.reject(new Error('network')), 'safe')).rejects.toMatchObject({
      code: McpErrorCode.UPSTREAM_ERROR,
    });
    const forbiddenError = Object.assign(new Error('forbidden'), { statusCode: 403 });
    await expect(catalogOptionalResult(Promise.reject(forbiddenError), 'Thing', 'one', 'safe')).rejects.toMatchObject({
      code: McpErrorCode.INSUFFICIENT_PERMISSIONS,
    });
  });
});
