/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import {
  CatalogClient,
  type AddLocationRequest,
  type AddLocationResponse,
  type CatalogRequestOptions,
  type GetEntitiesByRefsRequest,
  type GetEntitiesByRefsResponse,
  type GetEntityAncestorsRequest,
  type GetEntityAncestorsResponse,
  type GetEntityFacetsRequest,
  type GetEntityFacetsResponse,
  type Location,
  type QueryEntitiesRequest,
  type QueryEntitiesResponse,
  type ValidateEntityResponse,
} from '@backstage/catalog-client';
import type { CompoundEntityRef, Entity } from '@backstage/catalog-model';

import { ConfigurationError } from '../../shared/errors/error-handling.js';
import type { IAuthConfig, IBackstageCatalogApi } from '../../types/index.js';
import { AuthManager } from '../auth/auth-manager.js';

const CATALOG_PLUGIN_ID = 'catalog';
const CATALOG_PATH = '/api/catalog';

/** Options for the official Backstage Catalog client adapter. */
export interface IBackstageCatalogApiOptions {
  baseUrl: string;
  auth: IAuthConfig;
  fetch?: typeof globalThis.fetch;
}

/**
 * Converts a Backstage backend URL into the Catalog plugin base URL.
 * @param baseUrl - Backstage backend root or an explicit Catalog plugin URL.
 * @returns A normalized URL ending in `/api/catalog`.
 */
export function normalizeCatalogBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, '');
  return normalized.endsWith(CATALOG_PATH) ? normalized : `${normalized}${CATALOG_PATH}`;
}

/** Minimal discovery contract consumed by the official Catalog client. */
export interface ICatalogDiscoveryApi {
  getBaseUrl(pluginId: string): Promise<string>;
}

/**
 * Creates Catalog-only Backstage plugin discovery.
 * @param catalogBaseUrl - Normalized Catalog plugin base URL.
 * @returns Discovery that rejects requests for any other plugin.
 */
export function createCatalogDiscoveryApi(catalogBaseUrl: string): ICatalogDiscoveryApi {
  return {
    /**
     * Resolves the configured Catalog plugin base URL.
     * @param pluginId - Backstage plugin identifier requested by CatalogClient.
     * @returns The configured Catalog plugin base URL.
     * @throws {ConfigurationError} When a non-Catalog plugin is requested.
     */
    async getBaseUrl(pluginId: string): Promise<string> {
      if (pluginId !== CATALOG_PLUGIN_ID) {
        throw new ConfigurationError(`Unsupported Backstage plugin discovery request: ${pluginId}`);
      }
      return catalogBaseUrl;
    },
  };
}

/**
 * Creates a fetch implementation that supplies a Backstage external-access token.
 * @param fetchImplementation - Fetch implementation used to perform the request.
 * @param authManager - Bearer credential provider for requests without explicit authorization.
 * @returns A fetch implementation that authenticates Catalog requests.
 */
function createAuthenticatedFetch(
  fetchImplementation: typeof globalThis.fetch,
  authManager: Readonly<AuthManager>
): typeof globalThis.fetch {
  /**
   * Adds the configured external-access token unless a request-specific token is present.
   * @param input - URL or request passed by the official Catalog client.
   * @param init - Optional fetch request options.
   * @returns The upstream fetch response.
   */
  async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = new Request(input, init);
    if (request.headers.has('authorization')) return fetchImplementation(request);
    const headers = new Headers(request.headers);
    headers.set('authorization', authManager.getAuthorizationHeader());
    return fetchImplementation(new Request(request, { headers }));
  }

  return authenticatedFetch;
}

/**
 * Adapts the official Backstage CatalogClient to the server's application interface.
 *
 * Endpoint paths, query serialization, response handling, and future Catalog API
 * compatibility are delegated to the upstream client rather than reimplemented.
 */
export class BackstageCatalogApi implements IBackstageCatalogApi {
  private readonly client: CatalogClient;

  /**
   * Initializes an authenticated official Catalog API client.
   * @param options - Backstage URL, bearer credential, and optional fetch implementation.
   */
  constructor(options: Readonly<IBackstageCatalogApiOptions>) {
    const catalogBaseUrl = normalizeCatalogBaseUrl(options.baseUrl);
    const authManager = new AuthManager(options.auth);
    const fetchImplementation = options.fetch ?? globalThis.fetch;
    const authenticatedFetch = createAuthenticatedFetch(fetchImplementation, authManager);

    this.client = new CatalogClient({
      discoveryApi: createCatalogDiscoveryApi(catalogBaseUrl),
      fetchApi: { fetch: authenticatedFetch },
    });
  }

  /**
   * Retrieves multiple entities by canonical references.
   * @param request - Entity references and optional retained fields.
   * @param options - Optional Backstage request options.
   * @returns The matching entities in request order.
   */
  async getEntitiesByRefs(
    request: Readonly<GetEntitiesByRefsRequest>,
    options?: Readonly<CatalogRequestOptions>
  ): Promise<GetEntitiesByRefsResponse> {
    return this.client.getEntitiesByRefs(request, options);
  }

  /**
   * Queries entities through the current cursor-capable Catalog endpoint.
   * @param request - Filters, fields, ordering, search, or cursor parameters.
   * @param options - Optional Backstage request options.
   * @returns The matching entities and pagination information.
   */
  async queryEntities(
    request?: Readonly<QueryEntitiesRequest>,
    options?: Readonly<CatalogRequestOptions>
  ): Promise<QueryEntitiesResponse> {
    return this.client.queryEntities(request, options);
  }

  /**
   * Retrieves the ancestry graph for an entity.
   * @param request - Reference of the entity whose ancestry is required.
   * @param options - Optional Backstage request options.
   * @returns The root entity and its parent graph.
   */
  async getEntityAncestors(
    request: Readonly<GetEntityAncestorsRequest>,
    options?: Readonly<CatalogRequestOptions>
  ): Promise<GetEntityAncestorsResponse> {
    return this.client.getEntityAncestors(request, options);
  }

  /**
   * Retrieves one entity by string or compound reference.
   * @param entityRef - Canonical string or compound entity reference.
   * @param options - Optional Backstage request options.
   * @returns The matching entity, or undefined when it does not exist.
   */
  async getEntityByRef(
    entityRef: string | Readonly<CompoundEntityRef>,
    options?: Readonly<CatalogRequestOptions>
  ): Promise<Entity | undefined> {
    return this.client.getEntityByRef(entityRef, options);
  }

  /**
   * Removes an entity by its Catalog UID.
   * @param uid - Unique Catalog entity identifier.
   * @param options - Optional Backstage request options.
   * @returns A promise that resolves after removal completes.
   */
  async removeEntityByUid(uid: string, options?: Readonly<CatalogRequestOptions>): Promise<void> {
    await this.client.removeEntityByUid(uid, options);
  }

  /**
   * Schedules an entity refresh by canonical reference.
   * @param entityRef - Canonical entity reference to refresh.
   * @param options - Optional Backstage request options.
   * @returns A promise that resolves after the refresh is accepted.
   */
  async refreshEntity(entityRef: string, options?: Readonly<CatalogRequestOptions>): Promise<void> {
    await this.client.refreshEntity(entityRef, options);
  }

  /**
   * Retrieves facet values for selected entity fields.
   * @param request - Requested facets and optional entity filter.
   * @param options - Optional Backstage request options.
   * @returns Facet counts grouped by requested field.
   */
  async getEntityFacets(
    request: Readonly<GetEntityFacetsRequest>,
    options?: Readonly<CatalogRequestOptions>
  ): Promise<GetEntityFacetsResponse> {
    return this.client.getEntityFacets(request, options);
  }

  /**
   * Retrieves a Catalog location by identifier.
   * @param id - Unique location identifier.
   * @param options - Optional Backstage request options.
   * @returns The matching location, or undefined when it does not exist.
   */
  async getLocationById(id: string, options?: Readonly<CatalogRequestOptions>): Promise<Location | undefined> {
    return this.client.getLocationById(id, options);
  }

  /**
   * Retrieves a Catalog location by location reference.
   * @param locationRef - Location reference in `type:target` form.
   * @param options - Optional Backstage request options.
   * @returns The matching location, or undefined when it does not exist.
   */
  async getLocationByRef(
    locationRef: string,
    options?: Readonly<CatalogRequestOptions>
  ): Promise<Location | undefined> {
    return this.client.getLocationByRef(locationRef, options);
  }

  /**
   * Adds or dry-runs a Catalog location.
   * @param location - Location target and mutation behavior.
   * @param options - Optional Backstage request options.
   * @returns The registered location and entities discovered during processing.
   */
  async addLocation(
    location: Readonly<AddLocationRequest>,
    options?: Readonly<CatalogRequestOptions>
  ): Promise<AddLocationResponse> {
    return this.client.addLocation(location, options);
  }

  /**
   * Removes a Catalog location by identifier.
   * @param id - Unique location identifier.
   * @param options - Optional Backstage request options.
   * @returns A promise that resolves after removal completes.
   */
  async removeLocationById(id: string, options?: Readonly<CatalogRequestOptions>): Promise<void> {
    await this.client.removeLocationById(id, options);
  }

  /**
   * Retrieves the source location associated with an entity.
   * @param entityRef - Canonical string or compound entity reference.
   * @param options - Optional Backstage request options.
   * @returns The associated location, or undefined when none exists.
   */
  async getLocationByEntity(
    entityRef: string | Readonly<CompoundEntityRef>,
    options?: Readonly<CatalogRequestOptions>
  ): Promise<Location | undefined> {
    return this.client.getLocationByEntity(entityRef, options);
  }

  /**
   * Validates an entity descriptor in the context of a source location.
   * @param entity - Entity descriptor to validate.
   * @param locationRef - Location reference used for validation context.
   * @param options - Optional Backstage request options.
   * @returns The validation response produced by the Catalog backend.
   */
  async validateEntity(
    entity: Readonly<Entity>,
    locationRef: string,
    options?: Readonly<CatalogRequestOptions>
  ): Promise<ValidateEntityResponse> {
    return this.client.validateEntity(entity, locationRef, options);
  }
}
