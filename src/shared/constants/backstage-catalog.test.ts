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

import {
  AUTHORIZATION_HEADER_NAME,
  AuthType,
  BACKSTAGE_CATALOG_PATH,
  BACKSTAGE_CATALOG_PLUGIN_ID,
  BACKSTAGE_CATALOG_PLUGIN_NAME,
  BACKSTAGE_CATALOG_PLUGIN_VERSION,
  BACKSTAGE_MCP_SERVER_NAME,
  BACKSTAGE_MCP_SERVER_VERSION,
  BACKSTAGE_STATUS_CODE_PROPERTY,
  BackstageAuthorizationScheme,
  BackstageEnvironmentVariable,
  BackstageToolName,
  CATALOG_CACHE_TAG,
  CATALOG_CACHE_TTL_MS,
  CATALOG_OPERATION_TIMEOUT_MS,
  CATALOG_QUERY_LIMIT_MAXIMUM,
  CATALOG_RATE_LIMIT_MAXIMUM,
  CATALOG_RATE_LIMIT_WINDOW_MS,
  CatalogHttpStatus,
  CatalogLocationConflictMode,
  CatalogResultStatus,
  CatalogSortOrder,
  CatalogTotalItemsMode,
} from './backstage-catalog.js';

describe('Backstage Catalog constants', () => {
  it('should expose stable server and authentication vocabulary', () => {
    expect(BACKSTAGE_CATALOG_PLUGIN_NAME).toBe('backstage-catalog');
    expect(BACKSTAGE_CATALOG_PLUGIN_ID).toBe('catalog');
    expect(BACKSTAGE_CATALOG_PLUGIN_VERSION).toBe('2.0.0');
    expect(BACKSTAGE_CATALOG_PATH).toBe('/api/catalog');
    expect(BACKSTAGE_MCP_SERVER_NAME).toBe('backstage-mcp-server');
    expect(BACKSTAGE_MCP_SERVER_VERSION).toBe('2.0.0');
    expect(BACKSTAGE_STATUS_CODE_PROPERTY).toBe('statusCode');
    expect(AUTHORIZATION_HEADER_NAME).toBe('authorization');
    expect(AuthType.BEARER).toBe('bearer');
    expect(BackstageAuthorizationScheme.BEARER).toBe('Bearer');
    expect(Object.values(BackstageEnvironmentVariable)).toHaveLength(4);
  });

  it('should expose stable Catalog tool and policy vocabulary', () => {
    expect(Object.values(BackstageToolName)).toHaveLength(13);
    expect(CATALOG_CACHE_TAG).toBe('catalog');
    expect(CATALOG_CACHE_TTL_MS).toBe(120_000);
    expect(CATALOG_OPERATION_TIMEOUT_MS).toBe(30_000);
    expect(CATALOG_QUERY_LIMIT_MAXIMUM).toBe(1000);
    expect(CATALOG_RATE_LIMIT_MAXIMUM).toBe(50);
    expect(CATALOG_RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(CatalogHttpStatus.UNAUTHORIZED).toBe(401);
    expect(CatalogLocationConflictMode.REFRESH).toBe('refresh');
    expect(CatalogResultStatus.SUCCESS).toBe('success');
    expect(CatalogSortOrder.ASCENDING).toBe('asc');
    expect(CatalogTotalItemsMode.INCLUDE).toBe('include');
  });
});
