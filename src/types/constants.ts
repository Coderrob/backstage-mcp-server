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
/**
 * Tool name constants used throughout the MCP server
 * Centralizes tool names to avoid hard-coded strings
 */
export enum ToolName {
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

/**
 * Backstage entity field names
 * Common field names used in entity objects
 */
export enum EntityField {
  KIND = 'kind',
  SPEC = 'spec',
  METADATA = 'metadata',
  RELATIONS = 'relations',
  API_VERSION = 'apiVersion',
  NAMESPACE = 'namespace',
  NAME = 'name',
  TITLE = 'title',
  DESCRIPTION = 'description',
  TAGS = 'tags',
  ANNOTATIONS = 'annotations',
}

/**
 * Response message prefixes and common strings
 */
export enum ResponseMessage {
  SUCCESS_PREFIX = '✅ Success',
  ERROR_PREFIX = '❌ Error',
  UNKNOWN_ERROR = 'Unknown error occurred',
  NO_ENTITIES_FOUND = 'No entities found',
  ENTITY_NOT_FOUND = 'Entity not found',
  LOCATION_NOT_FOUND = 'Location not found',
}

/**
 * HTTP status codes used throughout the application
 * Provides named constants for common HTTP status codes
 */
export enum HttpStatusCode {
  OK = 200,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Common default values
 */
export enum DefaultValue {
  UNKNOWN = 'unknown',
  ENTITY = 'entity',
}

/**
 * Content types used in MCP responses
 */
export enum ContentType {
  TEXT = 'text',
}

/**
 * Common field names used in API responses
 */
export enum FieldName {
  DATA = 'data',
  MESSAGE = 'message',
  CONTENT = 'content',
  STATUS = 'status',
  TYPE = 'type',
}
