/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

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
