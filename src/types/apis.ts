import {
  AddLocationRequest,
  AddLocationResponse,
  CatalogRequestOptions,
  GetEntitiesByRefsRequest,
  GetEntitiesByRefsResponse,
  GetEntitiesRequest,
  GetEntitiesResponse,
  GetEntityAncestorsRequest,
  GetEntityAncestorsResponse,
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
  Location,
  QueryEntitiesRequest,
  QueryEntitiesResponse,
  ValidateEntityResponse,
} from '@backstage/catalog-client';
import { CompoundEntityRef, Entity } from '@backstage/catalog-model';

import { JsonApiDocument } from './json-api.js';
import { PaginationParams } from './paging.js';

export enum ApiStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface IApiResponse {
  status: ApiStatus;
  errors?: (Error | Record<string, unknown>)[];
}

export interface IApiDataResponse<T> extends IApiResponse {
  data: T[];
}

/**
 * Interface for the Backstage Catalog API client
 * Provides methods to interact with Backstage's catalog service
 */
export interface IBackstageCatalogApi {
  /**
   * Retrieve entities from the catalog with optional filtering and pagination
   * @param request - Optional request parameters for filtering entities
   * @param options - Optional catalog request options
   * @returns Promise resolving to entities response
   */
  getEntities(
    request?: GetEntitiesRequest & PaginationParams,
    options?: CatalogRequestOptions
  ): Promise<GetEntitiesResponse>;

  /**
   * Retrieve specific entities by their references
   * @param request - Request containing entity references to fetch
   * @param options - Optional catalog request options
   * @returns Promise resolving to entities by refs response
   */
  getEntitiesByRefs(
    request: GetEntitiesByRefsRequest,
    options?: CatalogRequestOptions
  ): Promise<GetEntitiesByRefsResponse>;

  /**
   * Query entities using advanced filtering capabilities
   * @param request - Optional query request parameters
   * @param options - Optional catalog request options
   * @returns Promise resolving to query entities response
   */
  queryEntities(request?: QueryEntitiesRequest, options?: CatalogRequestOptions): Promise<QueryEntitiesResponse>;

  /**
   * Get the ancestry (parent hierarchy) of an entity
   * @param request - Request containing entity reference
   * @param options - Optional catalog request options
   * @returns Promise resolving to entity ancestors response
   */
  getEntityAncestors(
    request: GetEntityAncestorsRequest,
    options?: CatalogRequestOptions
  ): Promise<GetEntityAncestorsResponse>;

  /**
   * Retrieve a single entity by its reference
   * @param entityRef - Entity reference (string or compound)
   * @param options - Optional catalog request options
   * @returns Promise resolving to entity or undefined if not found
   */
  getEntityByRef(entityRef: string | CompoundEntityRef, options?: CatalogRequestOptions): Promise<Entity | undefined>;

  /**
   * Remove an entity by its unique identifier
   * @param uid - Entity unique identifier
   * @param options - Optional catalog request options
   * @returns Promise resolving when entity is removed
   */
  removeEntityByUid(uid: string, options?: CatalogRequestOptions): Promise<void>;

  /**
   * Refresh an entity's data from its source
   * @param entityRef - Entity reference to refresh
   * @param options - Optional catalog request options
   * @returns Promise resolving when refresh is complete
   */
  refreshEntity(entityRef: string, options?: CatalogRequestOptions): Promise<void>;

  /**
   * Get entity facets for filtering and aggregation
   * @param request - Request for entity facets
   * @param options - Optional catalog request options
   * @returns Promise resolving to entity facets response
   */
  getEntityFacets(request: GetEntityFacetsRequest, options?: CatalogRequestOptions): Promise<GetEntityFacetsResponse>;

  /**
   * Retrieve a location by its identifier
   * @param id - Location identifier
   * @param options - Optional catalog request options
   * @returns Promise resolving to location or undefined if not found
   */
  getLocationById(id: string, options?: CatalogRequestOptions): Promise<Location | undefined>;

  /**
   * Retrieve a location by its reference
   * @param locationRef - Location reference
   * @param options - Optional catalog request options
   * @returns Promise resolving to location or undefined if not found
   */
  getLocationByRef(locationRef: string, options?: CatalogRequestOptions): Promise<Location | undefined>;

  /**
   * Add a new location to the catalog
   * @param location - Location request data
   * @param options - Optional catalog request options
   * @returns Promise resolving to add location response
   */
  addLocation(location: AddLocationRequest, options?: CatalogRequestOptions): Promise<AddLocationResponse>;

  /**
   * Remove a location by its identifier
   * @param id - Location identifier
   * @param options - Optional catalog request options
   * @returns Promise resolving when location is removed
   */
  removeLocationById(id: string, options?: CatalogRequestOptions): Promise<void>;

  /**
   * Get the location associated with an entity
   * @param entityRef - Entity reference
   * @param options - Optional catalog request options
   * @returns Promise resolving to location or undefined if not found
   */
  getLocationByEntity(
    entityRef: string | CompoundEntityRef,
    options?: CatalogRequestOptions
  ): Promise<Location | undefined>;

  /**
   * Validate an entity's structure and content
   * @param entity - Entity to validate
   * @param locationRef - Location reference for validation context
   * @param options - Optional catalog request options
   * @returns Promise resolving to validation response
   */
  validateEntity(entity: Entity, locationRef: string, options?: CatalogRequestOptions): Promise<ValidateEntityResponse>;

  /**
   * Get entities formatted according to JSON:API specification
   * Enhanced formatting for better LLM context and understanding
   * @param request - Optional request parameters with pagination
   * @returns Promise resolving to JSON:API formatted document
   */
  getEntitiesJsonApi(request?: GetEntitiesRequest & PaginationParams): Promise<JsonApiDocument>;
}
