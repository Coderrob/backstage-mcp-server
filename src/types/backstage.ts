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

import type {
  AddLocationRequest,
  AddLocationResponse,
  CatalogRequestOptions,
  GetEntitiesByRefsRequest,
  GetEntitiesByRefsResponse,
  GetEntityAncestorsRequest,
  GetEntityAncestorsResponse,
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
  Location,
  QueryEntitiesRequest,
  QueryEntitiesResponse,
  ValidateEntityResponse,
} from '@backstage/catalog-client';
import type { CompoundEntityRef, Entity } from '@backstage/catalog-model';

import type { IAuthConfig } from './auth.js';
import type { Logger } from './logging.js';
import type { McpTransportFactory } from './mcp.js';

/** Contract consumed by Backstage Catalog MCP tools. */
export interface IBackstageCatalogApi {
  /**
   * Retrieves specific entities by their references.
   * @param request - Request containing entity references to fetch.
   * @param options - Optional Catalog request options.
   * @returns Entities resolved for the requested references.
   */
  getEntitiesByRefs(
    request: GetEntitiesByRefsRequest,
    options?: CatalogRequestOptions
  ): Promise<GetEntitiesByRefsResponse>;

  /**
   * Queries entities using advanced filtering capabilities.
   * @param request - Optional query parameters.
   * @param options - Optional Catalog request options.
   * @returns Matching entities and pagination metadata.
   */
  queryEntities(request?: QueryEntitiesRequest, options?: CatalogRequestOptions): Promise<QueryEntitiesResponse>;

  /**
   * Gets the ancestry of an entity.
   * @param request - Entity ancestry request.
   * @param options - Optional Catalog request options.
   * @returns Entity ancestry response.
   */
  getEntityAncestors(
    request: GetEntityAncestorsRequest,
    options?: CatalogRequestOptions
  ): Promise<GetEntityAncestorsResponse>;

  /**
   * Retrieves a single entity by reference.
   * @param entityRef - String or compound entity reference.
   * @param options - Optional Catalog request options.
   * @returns The entity when found.
   */
  getEntityByRef(entityRef: string | CompoundEntityRef, options?: CatalogRequestOptions): Promise<Entity | undefined>;

  /**
   * Removes an entity by unique identifier.
   * @param uid - Entity unique identifier.
   * @param options - Optional Catalog request options.
   * @returns Completion after removal.
   */
  removeEntityByUid(uid: string, options?: CatalogRequestOptions): Promise<void>;

  /**
   * Requests an entity refresh.
   * @param entityRef - Entity reference to refresh.
   * @param options - Optional Catalog request options.
   * @returns Completion after the request is accepted.
   */
  refreshEntity(entityRef: string, options?: CatalogRequestOptions): Promise<void>;

  /**
   * Gets entity facets for filtering and aggregation.
   * @param request - Facet request.
   * @param options - Optional Catalog request options.
   * @returns Entity facet response.
   */
  getEntityFacets(request: GetEntityFacetsRequest, options?: CatalogRequestOptions): Promise<GetEntityFacetsResponse>;

  /**
   * Retrieves a location by identifier.
   * @param id - Location identifier.
   * @param options - Optional Catalog request options.
   * @returns The location when found.
   */
  getLocationById(id: string, options?: CatalogRequestOptions): Promise<Location | undefined>;

  /**
   * Retrieves a location by reference.
   * @param locationRef - Location reference.
   * @param options - Optional Catalog request options.
   * @returns The location when found.
   */
  getLocationByRef(locationRef: string, options?: CatalogRequestOptions): Promise<Location | undefined>;

  /**
   * Adds a Catalog location.
   * @param location - Location request.
   * @param options - Optional Catalog request options.
   * @returns Created location response.
   */
  addLocation(location: AddLocationRequest, options?: CatalogRequestOptions): Promise<AddLocationResponse>;

  /**
   * Removes a location by identifier.
   * @param id - Location identifier.
   * @param options - Optional Catalog request options.
   * @returns Completion after removal.
   */
  removeLocationById(id: string, options?: CatalogRequestOptions): Promise<void>;

  /**
   * Gets the location associated with an entity.
   * @param entityRef - String or compound entity reference.
   * @param options - Optional Catalog request options.
   * @returns The associated location when found.
   */
  getLocationByEntity(
    entityRef: string | CompoundEntityRef,
    options?: CatalogRequestOptions
  ): Promise<Location | undefined>;

  /**
   * Validates an entity in its source-location context.
   * @param entity - Entity to validate.
   * @param locationRef - Source location reference.
   * @param options - Optional Catalog request options.
   * @returns Validation response.
   */
  validateEntity(entity: Entity, locationRef: string, options?: CatalogRequestOptions): Promise<ValidateEntityResponse>;
}

/** Dependencies available to every Backstage Catalog MCP tool. */
export interface BackstageMcpContext {
  catalogClient: IBackstageCatalogApi;
}

/** Options for the official Backstage Catalog client adapter. */
export interface IBackstageCatalogApiOptions {
  baseUrl: string;
  auth: IAuthConfig;
  fetch?: typeof globalThis.fetch;
}

/** Minimal discovery contract consumed by the official Catalog client. */
export interface ICatalogDiscoveryApi {
  getBaseUrl(pluginId: string): Promise<string>;
}

/** Optional dependency and environment overrides for a Backstage MCP application. */
export interface BackstageServerOptions {
  env?: NodeJS.ProcessEnv;
  logger?: Logger;
  catalogClient?: IBackstageCatalogApi;
  transport?: McpTransportFactory;
}
