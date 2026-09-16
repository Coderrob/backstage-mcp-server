/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

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
  GET_ENTITIES: 'get_entities',
  GET_ENTITIES_BY_QUERY: 'get_entities_by_query',
  GET_ENTITIES_BY_REFS: 'get_entities_by_refs',
  GET_ENTITY_ANCESTORS: 'get_entity_ancestors',
  GET_ENTITY_BY_REF: 'get_entity_by_ref',
  GET_ENTITY_FACETS: 'get_entity_facets',
  GET_LOCATION_BY_ENTITY: 'get_location_by_entity',
  GET_LOCATION_BY_REF: 'get_location_by_ref',
  REFRESH_ENTITY: 'refresh_entity',
  REMOVE_ENTITY_BY_UID: 'remove_entity_by_uid',
  REMOVE_LOCATION_BY_ID: 'remove_location_by_id',
  VALIDATE_ENTITY: 'validate_entity',
});

/** Deterministic ordered list expected from MCP tool discovery. */
export const EXPECTED_MCP_TOOL_NAMES = Object.freeze(Object.values(MCP_TOOL_NAME));

/** Stable successful status emitted by Backstage MCP tool envelopes. */
export const MCP_RESULT_STATUS = Object.freeze({ SUCCESS: 'success' });
