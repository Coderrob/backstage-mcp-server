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
import { CompoundEntityRef, Entity, stringifyEntityRef } from '@backstage/catalog-model';
import axios, { AxiosInstance, isAxiosError } from 'axios';

import { AuthConfig, AuthManager } from '../auth/auth-manager.js';
import { securityAuditor } from '../auth/security-auditor.js';
import { CacheManager } from '../cache/cache-manager.js';
import { IBackstageCatalogApi, JsonApiDocument, PaginationParams, SecurityEventType } from '../types/index.js';
import { isNonEmptyString, isNumber, isString } from '../utils/core/guards.js';
import { logger } from '../utils/core/logger.js';
import { EntityRef } from '../utils/formatting/entity-ref.js';
import { JsonApiFormatter } from '../utils/formatting/jsonapi-formatter.js';
import { PaginationHelper } from '../utils/formatting/pagination-helper.js';

interface BackstageCatalogApiOptions {
  baseUrl: string;
  auth: AuthConfig;
}

export class BackstageCatalogApi implements IBackstageCatalogApi {
  private readonly client: AxiosInstance;
  private readonly authManager: AuthManager;
  private readonly cacheManager: CacheManager;

  constructor({ baseUrl, auth }: BackstageCatalogApiOptions) {
    logger.debug('Initializing BackstageCatalogApi', { baseUrl, authType: auth.type });
    this.authManager = new AuthManager(auth);
    this.cacheManager = new CacheManager();

    this.client = axios.create({
      baseURL: `${baseUrl.replace(/\/$/, '')}/api/catalog`,
      timeout: 30000, // 30 second timeout
    });
    logger.debug('Axios client created with base URL', { baseUrl: this.client.defaults.baseURL });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      try {
        // Check rate limit before making request
        await this.authManager.checkRateLimit();

        // Add authorization header if provided
        const authHeader = await this.authManager.getAuthorizationHeader();
        if (isNonEmptyString(authHeader)) {
          config.headers.Authorization = authHeader;
        }

        // Log security event with explicit fallbacks
        const resource = isNonEmptyString(config.url) ? String(config.url) : 'unknown';
        const action = isNonEmptyString(config.method) ? String(config.method).toUpperCase() : 'UNKNOWN';

        securityAuditor.logEvent({
          type: SecurityEventType.AUTH_SUCCESS,
          resource,
          action,
          success: true,
        });

        return config;
      } catch (error) {
        // Log authentication failure
        // Attempt to extract info from axios error if available
        let resource: string = 'unknown';
        let action = 'UNKNOWN';
        if (isAxiosError(error)) {
          resource = isNonEmptyString(error.config?.url) ? String(error.config!.url) : resource;
          action = isNonEmptyString(error.config?.method) ? String(error.config!.method).toUpperCase() : action;
        } else {
          resource = isNonEmptyString(config.url) ? String(config.url) : resource;
          action = isNonEmptyString(config.method) ? String(config.method).toUpperCase() : action;
        }

        securityAuditor.logEvent({
          type: SecurityEventType.AUTH_FAILURE,
          resource,
          action,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown auth error',
        });
        throw error;
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log security events for certain error types. Narrow to axios errors first
        if (isAxiosError(error)) {
          const resource = isNonEmptyString(error.config?.url) ? String(error.config!.url) : 'unknown';
          const action = isNonEmptyString(error.config?.method)
            ? String(error.config!.method).toUpperCase()
            : 'UNKNOWN';

          if (error.response?.status === 401) {
            securityAuditor.logEvent({
              type: SecurityEventType.UNAUTHORIZED_ACCESS,
              resource,
              action,
              success: false,
              errorMessage: 'Unauthorized access',
            });
          } else if (error.response?.status === 429) {
            securityAuditor.logEvent({
              type: SecurityEventType.RATE_LIMIT_EXCEEDED,
              resource,
              action,
              success: false,
              errorMessage: 'Rate limit exceeded',
            });
          }
        } else {
          // Fallback for non-axios errors that may still have a response shape
          const maybe = error as unknown as { response?: { status?: number } } | undefined;
          const maybeResponse = maybe && maybe.response ? maybe.response : undefined;
          if (isNumber(maybeResponse?.status) && maybeResponse.status === 401) {
            securityAuditor.logEvent({
              type: SecurityEventType.UNAUTHORIZED_ACCESS,
              resource: 'unknown',
              action: 'UNKNOWN',
              success: false,
              errorMessage: 'Unauthorized access',
            });
          } else if (isNumber(maybeResponse?.status) && maybeResponse.status === 429) {
            securityAuditor.logEvent({
              type: SecurityEventType.RATE_LIMIT_EXCEEDED,
              resource: 'unknown',
              action: 'UNKNOWN',
              success: false,
              errorMessage: 'Rate limit exceeded',
            });
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async getEntities(
    request?: GetEntitiesRequest & PaginationParams,
    _options?: CatalogRequestOptions
  ): Promise<GetEntitiesResponse> {
    logger.debug('Fetching entities', { request });
    // Extract pagination parameters
    const { limit, offset } = PaginationHelper.normalizeParams(request);

    // Create cache key from request parameters including pagination
    const cacheKey = `entities:${JSON.stringify({ ...request, limit, offset })}`;

    // Check cache first
    const cached = this.cacheManager.get<GetEntitiesResponse>(cacheKey);
    if (cached !== undefined && cached !== null) {
      logger.debug('Entities returned from cache');
      return cached;
    }

    logger.debug('Fetching entities from API', { limit, offset });
    const { data } = await this.client.get<GetEntitiesResponse>('/entities', {
      params: { ...request, limit, offset },
    });

    // Cache the result for 2 minutes (shorter TTL for list operations)
    this.cacheManager.set(cacheKey, data, 2 * 60 * 1000);
    logger.debug(`Fetched ${data.items?.length || 0} entities from API`);
    return data;
  }

  async getEntitiesByRefs(
    request: GetEntitiesByRefsRequest,
    _options?: CatalogRequestOptions
  ): Promise<GetEntitiesByRefsResponse> {
    const { entityRefs } = request;
    const { data } = await this.client.post<GetEntitiesByRefsResponse>('/entities/by-refs', { entityRefs });
    return data;
  }

  async queryEntities(
    request?: QueryEntitiesRequest,
    _options?: CatalogRequestOptions
  ): Promise<QueryEntitiesResponse> {
    const { data } = await this.client.post<QueryEntitiesResponse>('/entities/query', request);
    return data;
  }

  async getEntityAncestors(
    request: GetEntityAncestorsRequest,
    _options?: CatalogRequestOptions
  ): Promise<GetEntityAncestorsResponse> {
    const { entityRef } = request;
    const { data } = await this.client.get<GetEntityAncestorsResponse>(
      `/entities/by-name/${encodeURIComponent(entityRef)}/ancestry`
    );
    return data;
  }

  async getEntityByRef(
    entityRef: string | CompoundEntityRef,
    _options?: CatalogRequestOptions
  ): Promise<Entity | undefined> {
    const refString = isString(entityRef) ? String(entityRef) : this.formatCompoundEntityRef(entityRef);
    logger.debug('Fetching entity by ref', { entityRef: refString });

    const cacheKey = `entity:${refString}`;

    // Check cache first
    const cached = this.cacheManager.get<Entity>(cacheKey);
    if (cached !== undefined && cached !== null) {
      logger.debug('Entity returned from cache', { entityRef: refString });
      return cached;
    }

    try {
      logger.debug('Fetching entity from API', { entityRef: refString });

      // Parse the entity reference using the EntityRef class
      const entityRef = EntityRef.parse(refString);

      const { data } = await this.client.get<Entity>(
        `/entities/by-name/${encodeURIComponent(entityRef.kind)}/${encodeURIComponent(entityRef.namespace)}/${encodeURIComponent(entityRef.name)}`
      );

      // Cache the result for 5 minutes
      this.cacheManager.set(cacheKey, data, 5 * 60 * 1000);
      logger.debug('Entity fetched and cached', { entityRef: refString });

      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        logger.debug('Entity not found', { entityRef: refString });
        return undefined;
      }
      logger.error('Error fetching entity', {
        entityRef: refString,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async removeEntityByUid(uid: string, _options?: CatalogRequestOptions): Promise<void> {
    await this.client.delete(`/entities/by-uid/${encodeURIComponent(uid)}`);
  }

  async refreshEntity(entityRef: string, _options?: CatalogRequestOptions): Promise<void> {
    await this.client.post(`/refresh`, { entityRef });
  }

  async getEntityFacets(
    request: GetEntityFacetsRequest,
    _options?: CatalogRequestOptions
  ): Promise<GetEntityFacetsResponse> {
    const { data } = await this.client.post<GetEntityFacetsResponse>('/entities/facets', request);
    return data;
  }

  async getLocationById(id: string, _options?: CatalogRequestOptions): Promise<Location | undefined> {
    try {
      const { data } = await this.client.get<Location>(`/locations/${encodeURIComponent(id)}`);
      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return undefined;
      throw error;
    }
  }

  async getLocationByRef(locationRef: string, _options?: CatalogRequestOptions): Promise<Location | undefined> {
    try {
      const { data } = await this.client.get<Location>(`/locations/by-ref/${encodeURIComponent(locationRef)}`);
      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return undefined;
      throw error;
    }
  }

  async addLocation(location: AddLocationRequest, _options?: CatalogRequestOptions): Promise<AddLocationResponse> {
    const { data } = await this.client.post<AddLocationResponse>('/locations', location);
    return data;
  }

  async removeLocationById(id: string, _options?: CatalogRequestOptions): Promise<void> {
    await this.client.delete(`/locations/${encodeURIComponent(id)}`);
  }

  async getLocationByEntity(
    entityRef: string | CompoundEntityRef,
    _options?: CatalogRequestOptions
  ): Promise<Location | undefined> {
    const refString = isString(entityRef) ? String(entityRef) : this.formatCompoundEntityRef(entityRef);
    try {
      const { data } = await this.client.get<Location>(`/locations/by-entity/${encodeURIComponent(refString)}`);
      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return undefined;
      throw error;
    }
  }

  async validateEntity(
    entity: Entity,
    locationRef: string,
    _options?: CatalogRequestOptions
  ): Promise<ValidateEntityResponse> {
    const { data } = await this.client.post<ValidateEntityResponse>('/validate-entity', { entity, locationRef });
    return data;
  }

  /**
   * Get entities with JSON:API formatting for enhanced LLM context
   */
  async getEntitiesJsonApi(request?: GetEntitiesRequest & PaginationParams): Promise<JsonApiDocument> {
    const entities = await this.getEntities(request);
    // Convert to JSON:API format
    return JsonApiFormatter.entitiesToDocument(entities.items ?? []);
  }

  private formatCompoundEntityRef(entityRef: CompoundEntityRef): string {
    return stringifyEntityRef(entityRef);
  }
}
