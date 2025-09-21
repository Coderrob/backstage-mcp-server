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
import {
  AddLocationRequest,
  AddLocationResponse,
  GetEntitiesByRefsRequest,
  GetEntitiesByRefsResponse,
  GetEntitiesRequest,
  GetEntitiesResponse,
  GetEntityAncestorsRequest,
  GetEntityAncestorsResponse,
  GetEntityFacetsRequest,
  GetEntityFacetsResponse,
  QueryEntitiesRequest,
  QueryEntitiesResponse,
  ValidateEntityResponse,
} from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { jest } from '@jest/globals';
import axios, { AxiosInstance } from 'axios';

import { AuthManager } from '../../domain/auth/auth-manager.js';
import { securityAuditor } from '../../domain/auth/security-auditor.js';
import { CacheManager } from '../../domain/cache/cache-manager.js';
import { IApiDocument } from '../../shared/types/apis.js';
import { IAuthConfig } from '../../shared/types/auth.js';
import { IPaginationParams } from '../../shared/types/paging.js';
import { EntityRef } from '../../shared/utils/entity-ref.js';
import { JsonApiFormatter } from '../../shared/utils/jsonapi-formatter.js';
import { logger } from '../../shared/utils/logger.js';
import { PaginationHelper } from '../../shared/utils/pagination-helper.js';
import { axiosResponse, createMockAxiosInstance, createMockCacheManager } from '../../test/fixtures/mockFactories.js';
import { BackstageCatalogApi } from './backstage-catalog-api.js';

// Mock dependencies
jest.mock('axios');
jest.mock('../../domain/auth/auth-manager.js');
jest.mock('../../domain/auth/security-auditor.js');
jest.mock('../../domain/cache/cache-manager.js');
jest.mock('../../shared/utils/logger.js');
jest.mock('../../shared/utils/entity-ref.js');
jest.mock('../../shared/utils/jsonapi-formatter.js');
jest.mock('../../shared/utils/pagination-helper.js');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuthManager = AuthManager as jest.MockedClass<typeof AuthManager>;
const _mockedSecurityAuditor = securityAuditor as jest.Mocked<typeof securityAuditor>;
const mockedCacheManager = CacheManager as jest.MockedClass<typeof CacheManager>;
const _mockedLogger = logger as jest.Mocked<typeof logger>;
const mockedEntityRef = EntityRef as jest.Mocked<typeof EntityRef>;
const mockedJsonApiFormatter = JsonApiFormatter as jest.Mocked<typeof JsonApiFormatter>;
const mockedPaginationHelper = PaginationHelper as jest.Mocked<typeof PaginationHelper>;

describe('BackstageCatalogApi', () => {
  let api: BackstageCatalogApi;
  let mockClient: jest.Mocked<AxiosInstance>;
  let _mockAuthManager: jest.Mocked<AuthManager>;
  let mockCacheManager: jest.Mocked<CacheManager>;
  const baseUrl = 'http://localhost:7007';
  const authConfig: IAuthConfig = { type: 'bearer', token: 'test-token' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockAxiosInstance(`${baseUrl}/api/catalog`);
    // Ensure axios.create is a mocked function that returns our mock client
    (mockedAxios as unknown as { create?: unknown }).create = jest.fn().mockReturnValue(mockClient);

    _mockAuthManager = new mockedAuthManager(authConfig) as jest.Mocked<AuthManager>;
    // Provide a typed mock CacheManager
    mockCacheManager = createMockCacheManager();

    // Make the mocked CacheManager constructor return our manual mock instance
    if (typeof mockedCacheManager === 'function' && (mockedCacheManager as unknown as jest.Mock).mockImplementation) {
      (mockedCacheManager as unknown as jest.Mock).mockImplementation(
        () => mockCacheManager as unknown as CacheManager
      );
    }

    // Ensure helper static methods are jest.fn so tests can set mockReturnValue on them
    (mockedPaginationHelper as unknown as { normalizeParams?: jest.Mock }).normalizeParams = jest
      .fn()
      .mockImplementation((p?: unknown) => {
        const maybe = p as Record<string, unknown> | undefined;
        const limit = maybe && typeof maybe.limit === 'number' ? (maybe.limit as number) : 50;
        const offset = maybe && typeof maybe.offset === 'number' ? (maybe.offset as number) : 0;
        const page = maybe && typeof maybe.page === 'number' ? (maybe.page as number) : Math.floor(offset / limit) + 1;
        return { limit, offset, page };
      });
    (mockedEntityRef as unknown as { parse?: jest.Mock }).parse = jest.fn();
    (mockedJsonApiFormatter as unknown as { entitiesToDocument?: jest.Mock }).entitiesToDocument = jest.fn();

    api = new BackstageCatalogApi({ baseUrl, auth: authConfig });
    // Inject our manual mockCacheManager into the api instance to control cache behavior
    (api as unknown as { cacheManager?: CacheManager }).cacheManager = mockCacheManager as unknown as CacheManager;
  });

  describe('constructor', () => {
    it('should initialize with correct base URL and auth', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: `${baseUrl}/api/catalog`,
        timeout: 30000,
      });
      expect(mockClient.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('getEntities', () => {
    const mockResponse = {
      items: [{ kind: 'Component', apiVersion: 'backstage.io/v1beta1', metadata: { name: 'test' } }],
    } as unknown as GetEntitiesResponse;

    it('should return cached data if available', async () => {
      const request: GetEntitiesRequest & IPaginationParams = {
        limit: 10,
        offset: 0,
        page: 1,
      } as unknown as GetEntitiesRequest & IPaginationParams;
      mockCacheManager.get.mockReturnValue(mockResponse);

      const result = await api.getEntities(request);

      expect(mockCacheManager.get).toHaveBeenCalledWith(`entities:${JSON.stringify(request)}`);
      expect(result).toBe(mockResponse);
      expect(mockClient.get).not.toHaveBeenCalled();
    });

    it('should fetch from API and cache if not cached', async () => {
      const request: GetEntitiesRequest & IPaginationParams = { limit: 10, offset: 0 };
      mockCacheManager.get.mockReturnValue(undefined);
      mockedPaginationHelper.normalizeParams.mockReturnValue({ limit: 10, offset: 0, page: 1 });
      mockClient.get.mockResolvedValueOnce(axiosResponse<GetEntitiesResponse>(mockResponse));

      const result = await api.getEntities(request);

      expect(mockClient.get).toHaveBeenCalledWith('/entities', { params: request });
      expect(mockCacheManager.set).toHaveBeenCalledWith(`entities:${JSON.stringify(request)}`, mockResponse, 120000);
      expect(result).toBe(mockResponse);
    });
  });

  describe('getEntitiesByRefs', () => {
    const request: GetEntitiesByRefsRequest = { entityRefs: ['component:default/test'] };
    const mockResponse = {
      items: [{ kind: 'Component', apiVersion: 'backstage.io/v1beta1', metadata: { name: 'test' } }],
    } as unknown as GetEntitiesByRefsResponse;

    it('should post to /entities/by-refs and return data', async () => {
      mockClient.post.mockResolvedValueOnce(axiosResponse(mockResponse));

      const result = await api.getEntitiesByRefs(request);

      expect(mockClient.post).toHaveBeenCalledWith('/entities/by-refs', { entityRefs: request.entityRefs });
      expect(result).toBe(mockResponse);
    });
  });

  describe('queryEntities', () => {
    const request: QueryEntitiesRequest = { filter: { kind: 'Component' } };
    const mockResponse = {
      items: [{ kind: 'Component', apiVersion: 'backstage.io/v1beta1', metadata: { name: 'test' } }],
    } as unknown as QueryEntitiesResponse;

    it('should post to /entities/query and return data', async () => {
      mockClient.post.mockResolvedValueOnce(axiosResponse(mockResponse));

      const result = await api.queryEntities(request);

      expect(mockClient.post).toHaveBeenCalledWith('/entities/query', request);
      expect(result).toBe(mockResponse);
    });
  });

  describe('getEntityAncestors', () => {
    const request: GetEntityAncestorsRequest = { entityRef: 'component:default/test' };
    const mockResponse = { items: [], rootEntityRef: request.entityRef } as unknown as GetEntityAncestorsResponse;

    it('should get from /entities/by-name/.../ancestry and return data', async () => {
      mockClient.get.mockResolvedValueOnce(axiosResponse(mockResponse));

      const result = await api.getEntityAncestors(request);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/entities/by-name/${encodeURIComponent(request.entityRef)}/ancestry`
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getEntityByRef', () => {
    const entityRef = 'component:default/test';
    const mockEntity = {
      kind: 'Component',
      apiVersion: 'backstage.io/v1beta1',
      metadata: { name: 'test' },
    } as unknown as Entity;

    it('should return cached entity if available', async () => {
      mockCacheManager.get.mockReturnValue(mockEntity);

      const result = await api.getEntityByRef(entityRef);

      expect(mockCacheManager.get).toHaveBeenCalledWith(`entity:${entityRef}`);
      expect(result).toBe(mockEntity);
      expect(mockClient.get).not.toHaveBeenCalled();
    });

    it('should fetch from API and cache if not cached', async () => {
      mockCacheManager.get.mockReturnValue(undefined);
      mockedEntityRef.parse.mockReturnValue({ kind: 'component', namespace: 'default', name: 'test' });
      mockClient.get.mockResolvedValueOnce(axiosResponse<Entity>(mockEntity));

      const result = await api.getEntityByRef(entityRef);

      expect(mockClient.get).toHaveBeenCalledWith('/entities/by-name/component/default/test');
      expect(mockCacheManager.set).toHaveBeenCalledWith(`entity:${entityRef}`, mockEntity, 300000);
      expect(result).toBe(mockEntity);
    });

    it('should return undefined on 404', async () => {
      mockCacheManager.get.mockReturnValue(undefined);
      mockedEntityRef.parse.mockReturnValue({ kind: 'component', namespace: 'default', name: 'test' });
      const error = { response: { status: 404 } };
      mockClient.get.mockRejectedValue(error);

      const result = await api.getEntityByRef(entityRef);

      expect(result).toBeUndefined();
    });
  });

  describe('removeEntityByUid', () => {
    it('should delete entity by UID', async () => {
      const uid = 'test-uid';
      mockClient.delete.mockResolvedValueOnce(axiosResponse<void>(undefined));

      await api.removeEntityByUid(uid);

      expect(mockClient.delete).toHaveBeenCalledWith(`/entities/by-uid/${encodeURIComponent(uid)}`);
    });
  });

  describe('refreshEntity', () => {
    it('should post to /refresh with entityRef', async () => {
      const entityRef = 'component:default/test';
      mockClient.post.mockResolvedValueOnce(axiosResponse<void>(undefined));

      await api.refreshEntity(entityRef);

      expect(mockClient.post).toHaveBeenCalledWith('/refresh', { entityRef });
    });
  });

  describe('getEntityFacets', () => {
    const request: GetEntityFacetsRequest = { facets: ['kind'] };
    const mockResponse = { facets: {} } as unknown as GetEntityFacetsResponse;

    it('should post to /entities/facets and return data', async () => {
      mockClient.post.mockResolvedValueOnce(axiosResponse(mockResponse));

      const result = await api.getEntityFacets(request);

      expect(mockClient.post).toHaveBeenCalledWith('/entities/facets', request);
      expect(result).toBe(mockResponse);
    });
  });

  describe('getLocationById', () => {
    const id = 'test-id';
    const mockLocation = { type: 'url', target: 'http://example.com' } as unknown as Location;

    it('should get location by ID', async () => {
      mockClient.get.mockResolvedValueOnce(axiosResponse<Location>(mockLocation));

      const result = await api.getLocationById(id);

      expect(mockClient.get).toHaveBeenCalledWith(`/locations/${encodeURIComponent(id)}`);
      expect(result).toBe(mockLocation);
    });

    it('should return undefined on 404', async () => {
      const error = { response: { status: 404 } };
      mockClient.get.mockRejectedValue(error);

      const result = await api.getLocationById(id);

      expect(result).toBeUndefined();
    });
  });

  describe('getLocationByRef', () => {
    const locationRef = 'url:http://example.com';
    const mockLocation = { type: 'url', target: 'http://example.com' } as unknown as Location;

    it('should get location by ref', async () => {
      mockClient.get.mockResolvedValueOnce(axiosResponse<Location>(mockLocation));

      const result = await api.getLocationByRef(locationRef);

      expect(mockClient.get).toHaveBeenCalledWith(`/locations/by-ref/${encodeURIComponent(locationRef)}`);
      expect(result).toBe(mockLocation);
    });

    it('should return undefined on 404', async () => {
      const error = { response: { status: 404 } };
      mockClient.get.mockRejectedValue(error);

      const result = await api.getLocationByRef(locationRef);

      expect(result).toBeUndefined();
    });
  });

  describe('addLocation', () => {
    const location: AddLocationRequest = { type: 'url', target: 'http://example.com' };
    const mockResponse = { location: { type: 'url', target: 'http://example.com' } } as unknown as AddLocationResponse;

    it('should post to /locations and return data', async () => {
      mockClient.post.mockResolvedValueOnce(axiosResponse<AddLocationResponse>(mockResponse));

      const result = await api.addLocation(location);

      expect(mockClient.post).toHaveBeenCalledWith('/locations', location);
      expect(result).toBe(mockResponse);
    });
  });

  describe('removeLocationById', () => {
    it('should delete location by ID', async () => {
      const id = 'test-id';
      mockClient.delete.mockResolvedValueOnce(axiosResponse<void>(undefined));

      await api.removeLocationById(id);

      expect(mockClient.delete).toHaveBeenCalledWith(`/locations/${encodeURIComponent(id)}`);
    });
  });

  describe('getLocationByEntity', () => {
    const entityRef = 'component:default/test';
    const mockLocation = { type: 'url', target: 'http://example.com' } as unknown as Location;

    it('should get location by entity ref', async () => {
      mockClient.get.mockResolvedValueOnce(axiosResponse<Location>(mockLocation));

      const result = await api.getLocationByEntity(entityRef);

      expect(mockClient.get).toHaveBeenCalledWith(`/locations/by-entity/${encodeURIComponent(entityRef)}`);
      expect(result).toBe(mockLocation);
    });

    it('should return undefined on 404', async () => {
      const error = { response: { status: 404 } };
      mockClient.get.mockRejectedValue(error);

      const result = await api.getLocationByEntity(entityRef);

      expect(result).toBeUndefined();
    });
  });

  describe('validateEntity', () => {
    const entity = {
      kind: 'Component',
      apiVersion: 'backstage.io/v1beta1',
      metadata: { name: 'test' },
    } as unknown as Entity;
    const locationRef = 'url:http://example.com';
    const mockResponse: ValidateEntityResponse = { valid: true };

    it('should post to /validate-entity and return data', async () => {
      mockClient.post.mockResolvedValueOnce(axiosResponse<ValidateEntityResponse>(mockResponse));

      const result = await api.validateEntity(entity, locationRef);

      expect(mockClient.post).toHaveBeenCalledWith('/validate-entity', { entity, locationRef });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getEntitiesJsonApi', () => {
    const mockEntities: Entity[] = [
      { kind: 'Component', apiVersion: 'backstage.io/v1beta1', metadata: { name: 'test' } } as unknown as Entity,
    ];
    const mockDocument: IApiDocument = { data: [], version: '1.0' };

    it('should get entities and format to JSON:API', async () => {
      jest.spyOn(api, 'getEntities').mockResolvedValueOnce({ items: mockEntities } as unknown as GetEntitiesResponse);
      mockedJsonApiFormatter.entitiesToDocument.mockReturnValue(mockDocument);

      const result = await api.getEntitiesJsonApi();

      expect(api.getEntities).toHaveBeenCalled();
      expect(mockedJsonApiFormatter.entitiesToDocument).toHaveBeenCalledWith(mockEntities);
      expect(result).toBe(mockDocument);
    });
  });
});
