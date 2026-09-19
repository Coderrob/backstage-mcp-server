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

import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  ANNOTATION_SOURCE_LOCATION,
  RELATION_API_CONSUMED_BY,
  RELATION_API_PROVIDED_BY,
  RELATION_CHILD_OF,
  RELATION_CONSUMES_API,
  RELATION_DEPENDENCY_OF,
  RELATION_DEPENDS_ON,
  RELATION_HAS_MEMBER,
  RELATION_HAS_PART,
  RELATION_MEMBER_OF,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
  RELATION_PARENT_OF,
  RELATION_PART_OF,
  RELATION_PROVIDES_API,
} from '@backstage/catalog-model';
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
  BACKSTAGE_ORPHAN_ANNOTATION_VALUE,
  BACKSTAGE_STATUS_CODE_PROPERTY,
  BackstageAnnotationKey,
  BackstageAuthorizationScheme,
  BackstageEntityKind,
  BackstageEnvironmentVariable,
  BackstageRelation,
  BackstageToolName,
  CATALOG_CACHE_TAG,
  CATALOG_CACHE_TTL_MS,
  CATALOG_OPERATION_TIMEOUT_MS,
  CATALOG_QUERY_LIMIT_MAXIMUM,
  CATALOG_RATE_LIMIT_MAXIMUM,
  CATALOG_RATE_LIMIT_WINDOW_MS,
  CatalogHttpStatus,
  CatalogLocationConflictMode,
  CatalogLookupField,
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

  it('should expose the nine documented built-in entity kinds with canonical casing', () => {
    expect(Object.values(BackstageEntityKind)).toEqual([
      'API',
      'Component',
      'Domain',
      'Group',
      'Location',
      'Resource',
      'System',
      'Template',
      'User',
    ]);
  });

  it('should match official Backstage relation values', () => {
    expect(Object.values(BackstageRelation)).toEqual([
      RELATION_API_CONSUMED_BY,
      RELATION_API_PROVIDED_BY,
      RELATION_CHILD_OF,
      RELATION_CONSUMES_API,
      RELATION_DEPENDENCY_OF,
      RELATION_DEPENDS_ON,
      RELATION_HAS_MEMBER,
      RELATION_HAS_PART,
      RELATION_MEMBER_OF,
      RELATION_OWNED_BY,
      RELATION_OWNER_OF,
      RELATION_PARENT_OF,
      RELATION_PART_OF,
      RELATION_PROVIDES_API,
    ]);
  });

  it('should identify selected documented annotation keys and the orphan marker', () => {
    expect(BackstageAnnotationKey.MANAGED_BY_LOCATION).toBe(ANNOTATION_LOCATION);
    expect(BackstageAnnotationKey.MANAGED_BY_ORIGIN_LOCATION).toBe(ANNOTATION_ORIGIN_LOCATION);
    expect(BackstageAnnotationKey.SOURCE_LOCATION).toBe(ANNOTATION_SOURCE_LOCATION);
    expect(BackstageAnnotationKey.TECHDOCS_REF).toBe('backstage.io/techdocs-ref');
    expect(BackstageAnnotationKey.ORPHAN).toBe('backstage.io/orphan');
    expect(BACKSTAGE_ORPHAN_ANNOTATION_VALUE).toBe('true');
  });

  it('should expose stable standard paths used by contextual Catalog queries', () => {
    expect(Object.values(CatalogLookupField)).toEqual([
      'metadata.annotations',
      'metadata.name',
      'metadata.namespace',
      'metadata.title',
      'relations',
    ]);
  });

  it('should expose stable Catalog tool and policy vocabulary', () => {
    expect(Object.values(BackstageToolName)).toHaveLength(32);
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
