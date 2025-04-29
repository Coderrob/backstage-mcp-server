import axios, { AxiosInstance } from 'axios';
import {
  AddLocationRequest,
  AddLocationResponse,
  CatalogApi,
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
import {
  CompoundEntityRef,
  Entity,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { isString } from '../utils/guards';

interface BackstageCatalogApiOptions {
  baseUrl: string;
  token?: string;
}

export class BackstageCatalogApi implements CatalogApi {
  private readonly client: AxiosInstance;

  constructor({ baseUrl, token }: BackstageCatalogApiOptions) {
    this.client = axios.create({
      baseURL: `${baseUrl.replace(/\/$/, '')}/v1`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async getEntities(
    request?: GetEntitiesRequest,
    _options?: CatalogRequestOptions
  ): Promise<GetEntitiesResponse> {
    const { data } = await this.client.get<GetEntitiesResponse>('/entities', {
      params: request,
    });
    return data;
  }

  async getEntitiesByRefs(
    request: GetEntitiesByRefsRequest,
    _options?: CatalogRequestOptions
  ): Promise<GetEntitiesByRefsResponse> {
    const { entityRefs } = request;
    const { data } = await this.client.post<GetEntitiesByRefsResponse>(
      '/entities/by-refs',
      { entityRefs }
    );
    return data;
  }

  async queryEntities(
    request?: QueryEntitiesRequest,
    _options?: CatalogRequestOptions
  ): Promise<QueryEntitiesResponse> {
    const { data } = await this.client.post<QueryEntitiesResponse>(
      '/entities/query',
      request
    );
    return data;
  }

  async getEntityAncestors(
    request: GetEntityAncestorsRequest,
    _options?: CatalogRequestOptions
  ): Promise<GetEntityAncestorsResponse> {
    const { entityRef } = request;
    const { data } = await this.client.get<GetEntityAncestorsResponse>(
      `/entities/by-ref/${encodeURIComponent(entityRef)}/ancestry`
    );
    return data;
  }

  async getEntityByRef(
    entityRef: string | CompoundEntityRef,
    _options?: CatalogRequestOptions
  ): Promise<Entity | undefined> {
    const refString = isString(entityRef)
      ? entityRef
      : this.formatCompoundEntityRef(entityRef);
    try {
      const { data } = await this.client.get<Entity>(
        `/entities/by-ref/${encodeURIComponent(refString)}`
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404)
        return undefined;
      throw error;
    }
  }

  async removeEntityByUid(
    uid: string,
    _options?: CatalogRequestOptions
  ): Promise<void> {
    await this.client.delete(`/entities/by-uid/${encodeURIComponent(uid)}`);
  }

  async refreshEntity(
    entityRef: string,
    _options?: CatalogRequestOptions
  ): Promise<void> {
    await this.client.post(`/refresh`, { entityRef });
  }

  async getEntityFacets(
    request: GetEntityFacetsRequest,
    _options?: CatalogRequestOptions
  ): Promise<GetEntityFacetsResponse> {
    const { data } = await this.client.post<GetEntityFacetsResponse>(
      '/entities/facets',
      request
    );
    return data;
  }

  async getLocationById(
    id: string,
    _options?: CatalogRequestOptions
  ): Promise<Location | undefined> {
    try {
      const { data } = await this.client.get<Location>(
        `/locations/${encodeURIComponent(id)}`
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404)
        return undefined;
      throw error;
    }
  }

  async getLocationByRef(
    locationRef: string,
    _options?: CatalogRequestOptions
  ): Promise<Location | undefined> {
    try {
      const { data } = await this.client.get<Location>(
        `/locations/by-ref/${encodeURIComponent(locationRef)}`
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404)
        return undefined;
      throw error;
    }
  }

  async addLocation(
    location: AddLocationRequest,
    _options?: CatalogRequestOptions
  ): Promise<AddLocationResponse> {
    const { data } = await this.client.post<AddLocationResponse>(
      '/locations',
      location
    );
    return data;
  }

  async removeLocationById(
    id: string,
    _options?: CatalogRequestOptions
  ): Promise<void> {
    await this.client.delete(`/locations/${encodeURIComponent(id)}`);
  }

  async getLocationByEntity(
    entityRef: string | CompoundEntityRef,
    _options?: CatalogRequestOptions
  ): Promise<Location | undefined> {
    const refString = isString(entityRef)
      ? entityRef
      : this.formatCompoundEntityRef(entityRef);
    try {
      const { data } = await this.client.get<Location>(
        `/locations/by-entity/${encodeURIComponent(refString)}`
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404)
        return undefined;
      throw error;
    }
  }

  async validateEntity(
    entity: Entity,
    locationRef: string,
    _options?: CatalogRequestOptions
  ): Promise<ValidateEntityResponse> {
    const { data } = await this.client.post<ValidateEntityResponse>(
      '/validate-entity',
      { entity, locationRef }
    );
    return data;
  }

  private formatCompoundEntityRef(entityRef: CompoundEntityRef): string {
    return stringifyEntityRef(entityRef);
  }
}
