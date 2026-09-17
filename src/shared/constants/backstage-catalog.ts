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

/** Stable Backstage Catalog plugin identifier. */
export const BACKSTAGE_CATALOG_PLUGIN_NAME = 'backstage-catalog';

/** Plugin identifier requested through Backstage discovery. */
export const BACKSTAGE_CATALOG_PLUGIN_ID = 'catalog';

/** Current Backstage Catalog plugin contract version. */
export const BACKSTAGE_CATALOG_PLUGIN_VERSION = '2.0.0';

/** Default HTTP path of the Backstage Catalog backend plugin. */
export const BACKSTAGE_CATALOG_PATH = '/api/catalog';

/** Stable Backstage MCP server identifier. */
export const BACKSTAGE_MCP_SERVER_NAME = 'backstage-mcp-server';

/** Current Backstage MCP server contract version. */
export const BACKSTAGE_MCP_SERVER_VERSION = '2.0.0';

/** Canonical HTTP request header used for Backstage credentials. */
export const AUTHORIZATION_HEADER_NAME = 'authorization';

/** ResponseError property containing the upstream HTTP status. */
export const BACKSTAGE_STATUS_CODE_PROPERTY = 'statusCode';

/** Shared cache tag for Backstage Catalog reads and invalidations. */
export const CATALOG_CACHE_TAG = 'catalog';

/** Default lifetime for cached Catalog read results. */
export const CATALOG_CACHE_TTL_MS = 120_000;

/** Default timeout for Backstage Catalog operations. */
export const CATALOG_OPERATION_TIMEOUT_MS = 30_000;

/** Largest entity query page accepted by the MCP schema. */
export const CATALOG_QUERY_LIMIT_MAXIMUM = 1000;

/** Maximum number of Catalog mutations permitted in one rate-limit window. */
export const CATALOG_RATE_LIMIT_MAXIMUM = 50;

/** Catalog mutation rate-limit window duration. */
export const CATALOG_RATE_LIMIT_WINDOW_MS = 60_000;

/** Environment variables recognized by the Backstage MCP server. */
export enum BackstageEnvironmentVariable {
  BASE_URL = 'BACKSTAGE_BASE_URL',
  LOG_LEVEL = 'LOG_LEVEL',
  TOKEN = 'BACKSTAGE_TOKEN',
  TOKEN_FILE = 'BACKSTAGE_TOKEN_FILE',
}

/** Supported HTTP authentication schemes emitted by the Backstage client. */
export enum BackstageAuthorizationScheme {
  BEARER = 'Bearer',
}

/** Supported Backstage external authentication configuration types. */
export enum AuthType {
  BEARER = 'bearer',
}

/** Stable names for the complete Backstage Catalog MCP tool surface. */
export enum BackstageToolName {
  ADD_LOCATION = 'add_location',
  GET_ENTITIES = 'get_entities',
  GET_ENTITIES_BY_QUERY = 'get_entities_by_query',
  GET_ENTITIES_BY_REFS = 'get_entities_by_refs',
  GET_ENTITY_ANCESTORS = 'get_entity_ancestors',
  GET_ENTITY_BY_REF = 'get_entity_by_ref',
  GET_ENTITY_FACETS = 'get_entity_facets',
  GET_LOCATION_BY_ENTITY = 'get_location_by_entity',
  GET_LOCATION_BY_REF = 'get_location_by_ref',
  REFRESH_ENTITY = 'refresh_entity',
  REMOVE_ENTITY_BY_UID = 'remove_entity_by_uid',
  REMOVE_LOCATION_BY_ID = 'remove_location_by_id',
  VALIDATE_ENTITY = 'validate_entity',
}

/** Conflict behaviors accepted by the Catalog location API. */
export enum CatalogLocationConflictMode {
  REJECT = 'reject',
  REFRESH = 'refresh',
}

/** Stable status values returned in Catalog tool result envelopes. */
export enum CatalogResultStatus {
  SUCCESS = 'success',
}

/** Sort directions accepted by Catalog entity queries. */
export enum CatalogSortOrder {
  ASCENDING = 'asc',
  DESCENDING = 'desc',
}

/** Controls whether Catalog entity queries calculate the total result count. */
export enum CatalogTotalItemsMode {
  INCLUDE = 'include',
  EXCLUDE = 'exclude',
}

/** Upstream HTTP statuses translated into stable MCP errors. */
export enum CatalogHttpStatus {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
}
