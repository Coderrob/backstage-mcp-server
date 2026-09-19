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

/** Documented Backstage entity kinds; custom Catalog kinds remain valid. */
export enum BackstageEntityKind {
  API = 'API',
  COMPONENT = 'Component',
  DOMAIN = 'Domain',
  GROUP = 'Group',
  LOCATION = 'Location',
  RESOURCE = 'Resource',
  SYSTEM = 'System',
  TEMPLATE = 'Template',
  USER = 'User',
}

/** Selected well-known Backstage annotation keys; custom keys remain valid. */
export enum BackstageAnnotationKey {
  MANAGED_BY_LOCATION = 'backstage.io/managed-by-location',
  MANAGED_BY_ORIGIN_LOCATION = 'backstage.io/managed-by-origin-location',
  ORPHAN = 'backstage.io/orphan',
  SOURCE_LOCATION = 'backstage.io/source-location',
  TECHDOCS_REF = 'backstage.io/techdocs-ref',
}

/** Exact string used by Backstage for the orphan marker annotation. */
export const BACKSTAGE_ORPHAN_ANNOTATION_VALUE = 'true';

/** Standard entity paths used by contextual Catalog filters and searches. */
export enum CatalogLookupField {
  METADATA_ANNOTATIONS = 'metadata.annotations',
  METADATA_NAME = 'metadata.name',
  METADATA_NAMESPACE = 'metadata.namespace',
  METADATA_TITLE = 'metadata.title',
  RELATIONS = 'relations',
}

/** Documented directional Catalog relations; custom relation types remain valid. */
export enum BackstageRelation {
  API_CONSUMED_BY = 'apiConsumedBy',
  API_PROVIDED_BY = 'apiProvidedBy',
  CHILD_OF = 'childOf',
  CONSUMES_API = 'consumesApi',
  DEPENDENCY_OF = 'dependencyOf',
  DEPENDS_ON = 'dependsOn',
  HAS_MEMBER = 'hasMember',
  HAS_PART = 'hasPart',
  MEMBER_OF = 'memberOf',
  OWNED_BY = 'ownedBy',
  OWNER_OF = 'ownerOf',
  PARENT_OF = 'parentOf',
  PART_OF = 'partOf',
  PROVIDES_API = 'providesApi',
}

/** Stable names for the complete Backstage Catalog MCP tool surface. */
export enum BackstageToolName {
  ADD_LOCATION = 'add_location',
  FIND_ENTITIES_BY_NAME = 'find_entities_by_name',
  FIND_USERS_BY_NAME = 'find_users_by_name',
  GET_APIS_BY_CONSUMER = 'get_apis_by_consumer',
  GET_APIS_BY_PROVIDER = 'get_apis_by_provider',
  GET_CHILD_GROUPS_BY_GROUP = 'get_child_groups_by_group',
  GET_CONSUMERS_BY_API = 'get_consumers_by_api',
  GET_DEPENDENCIES_BY_ENTITY = 'get_dependencies_by_entity',
  GET_DEPENDENTS_BY_ENTITY = 'get_dependents_by_entity',
  GET_ENTITIES = 'get_entities',
  GET_ENTITIES_BY_ANNOTATION = 'get_entities_by_annotation',
  GET_ENTITIES_BY_DOMAIN = 'get_entities_by_domain',
  GET_ENTITIES_BY_OWNER = 'get_entities_by_owner',
  GET_ENTITIES_BY_QUERY = 'get_entities_by_query',
  GET_ENTITIES_BY_REFS = 'get_entities_by_refs',
  GET_ENTITIES_BY_SYSTEM = 'get_entities_by_system',
  GET_ENTITY_ANCESTORS = 'get_entity_ancestors',
  GET_ENTITY_BY_REF = 'get_entity_by_ref',
  GET_ENTITY_FACETS = 'get_entity_facets',
  GET_GROUPS_BY_USER = 'get_groups_by_user',
  GET_LOCATION_BY_ENTITY = 'get_location_by_entity',
  GET_LOCATION_BY_REF = 'get_location_by_ref',
  GET_ORPHANED_ENTITIES = 'get_orphaned_entities',
  GET_OWNERS_BY_ENTITY = 'get_owners_by_entity',
  GET_PROVIDERS_BY_API = 'get_providers_by_api',
  GET_SUBDOMAINS_BY_DOMAIN = 'get_subdomains_by_domain',
  GET_SYSTEMS_BY_DOMAIN = 'get_systems_by_domain',
  GET_USERS_BY_GROUP = 'get_users_by_group',
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
