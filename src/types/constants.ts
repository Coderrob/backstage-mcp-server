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
 * Common default values
 */
export enum DefaultValue {
  UNKNOWN = 'unknown',
  ENTITY = 'entity',
}
