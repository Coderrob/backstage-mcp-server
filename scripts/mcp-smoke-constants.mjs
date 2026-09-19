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

/** Environment variable names used by MCP smoke-test child processes. */
export const BACKSTAGE_ENVIRONMENT_VARIABLE = Object.freeze({
  BASE_URL: 'BACKSTAGE_BASE_URL',
  LOG_LEVEL: 'LOG_LEVEL',
  TOKEN: 'BACKSTAGE_TOKEN',
  TOKEN_FILE: 'BACKSTAGE_TOKEN_FILE',
});

/** Catalog endpoint used by single-call smoke checks. */
export const CATALOG_QUERY_PATH = '/api/catalog/entities/by-query?limit=1';

/** HTTP header names used by deterministic Catalog stubs. */
export const HTTP_HEADER = Object.freeze({
  AUTHORIZATION: 'authorization',
  CONTENT_TYPE: 'content-type',
});

/** HTTP authorization schemes asserted at the Catalog boundary. */
export const HTTP_AUTHORIZATION_SCHEME = Object.freeze({ BEARER: 'Bearer' });

/** HTTP response statuses used by deterministic Catalog stubs. */
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
});

/** MIME types emitted by deterministic Catalog stubs. */
export const MIME_TYPE = Object.freeze({ JSON: 'application/json' });

/** Log levels selected for child MCP server processes. */
export const PROCESS_LOG_LEVEL = Object.freeze({ INFO: 'info', WARN: 'warn' });

/** Built package entrypoint exercised by the MCP smoke suites. */
export const PACKAGED_SERVER_ENTRY = 'dist/cli.cjs';

/** Loopback host used by isolated Catalog fixtures. */
export const LOOPBACK_HOST = '127.0.0.1';

/** Node.js event names observed by deterministic HTTP fixtures. */
export const NODE_EVENT = Object.freeze({ CLOSE: 'close', LISTENING: 'listening' });

/** Child-process stderr mode that prevents protocol-channel contamination. */
export const STDERR_MODE = 'pipe';

/** Shared version used by disposable MCP smoke-test clients. */
export const SMOKE_CLIENT_VERSION = '1.0.0';

/** Stable names for the Backstage Catalog MCP tool surface. */
export const MCP_TOOL_NAME = Object.freeze({
  ADD_LOCATION: 'add_location',
  FIND_ENTITIES_BY_NAME: 'find_entities_by_name',
  FIND_USERS_BY_NAME: 'find_users_by_name',
  GET_APIS_BY_CONSUMER: 'get_apis_by_consumer',
  GET_APIS_BY_PROVIDER: 'get_apis_by_provider',
  GET_CHILD_GROUPS_BY_GROUP: 'get_child_groups_by_group',
  GET_CONSUMERS_BY_API: 'get_consumers_by_api',
  GET_DEPENDENCIES_BY_ENTITY: 'get_dependencies_by_entity',
  GET_DEPENDENTS_BY_ENTITY: 'get_dependents_by_entity',
  GET_ENTITIES: 'get_entities',
  GET_ENTITIES_BY_ANNOTATION: 'get_entities_by_annotation',
  GET_ENTITIES_BY_DOMAIN: 'get_entities_by_domain',
  GET_ENTITIES_BY_OWNER: 'get_entities_by_owner',
  GET_ENTITIES_BY_QUERY: 'get_entities_by_query',
  GET_ENTITIES_BY_REFS: 'get_entities_by_refs',
  GET_ENTITIES_BY_SYSTEM: 'get_entities_by_system',
  GET_ENTITY_ANCESTORS: 'get_entity_ancestors',
  GET_ENTITY_BY_REF: 'get_entity_by_ref',
  GET_ENTITY_FACETS: 'get_entity_facets',
  GET_GROUPS_BY_USER: 'get_groups_by_user',
  GET_LOCATION_BY_ENTITY: 'get_location_by_entity',
  GET_LOCATION_BY_REF: 'get_location_by_ref',
  GET_ORPHANED_ENTITIES: 'get_orphaned_entities',
  GET_OWNERS_BY_ENTITY: 'get_owners_by_entity',
  GET_PROVIDERS_BY_API: 'get_providers_by_api',
  GET_SUBDOMAINS_BY_DOMAIN: 'get_subdomains_by_domain',
  GET_SYSTEMS_BY_DOMAIN: 'get_systems_by_domain',
  GET_USERS_BY_GROUP: 'get_users_by_group',
  REFRESH_ENTITY: 'refresh_entity',
  REMOVE_ENTITY_BY_UID: 'remove_entity_by_uid',
  REMOVE_LOCATION_BY_ID: 'remove_location_by_id',
  VALIDATE_ENTITY: 'validate_entity',
});

/** Deterministic ordered list expected from MCP tool discovery. */
export const EXPECTED_MCP_TOOL_NAMES = Object.freeze(Object.values(MCP_TOOL_NAME));

/** Stable successful status emitted by Backstage MCP tool envelopes. */
export const MCP_RESULT_STATUS = Object.freeze({ SUCCESS: 'success' });

/** Decisive query parameters expected from contextual tools in smoke-call order. */
export const CONTEXTUAL_QUERY_EXPECTATIONS = Object.freeze([
  ['fullTextFilterTerm', 'smoke'],
  ['filter', 'kind=User'],
  ['filter', 'relations.apiConsumedBy=component:default/smoke-service'],
  ['filter', 'relations.apiProvidedBy=component:default/smoke-service'],
  ['filter', 'relations.childOf=group:default/smoke'],
  ['filter', 'relations.consumesApi=api:default/smoke'],
  ['filter', 'relations.dependencyOf=component:default/smoke-service'],
  ['filter', 'relations.dependsOn=component:default/smoke-service'],
  ['filter', 'metadata.annotations.backstage.io/orphan=true'],
  ['filter', 'relations.partOf=domain:default/smoke'],
  ['filter', 'relations.ownedBy=group:default/smoke'],
  ['filter', 'relations.partOf=system:default/smoke'],
  ['filter', 'relations.hasMember=user:default/smoke'],
  ['filter', 'metadata.annotations.backstage.io/orphan=true'],
  ['filter', 'relations.ownerOf=component:default/smoke-service'],
  ['filter', 'relations.providesApi=api:default/smoke'],
  ['filter', 'relations.partOf=domain:default/smoke'],
  ['filter', 'relations.partOf=domain:default/smoke'],
  ['filter', 'relations.memberOf=group:default/smoke'],
]);
