/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { describe, expect, it } from 'vitest';

import { BackstageCatalogApi, createCatalogDiscoveryApi, normalizeCatalogBaseUrl } from './backstage-catalog-api.js';

const TEST_ENTITY_REF = 'component:default/api';
const TEST_BASE_URL = 'https://backstage.example.com';
const TEST_CATALOG_URL = `${TEST_BASE_URL}/api/catalog`;
const TEST_TOKEN = 'external-token';
const METADATA_NAME_FIELD = 'metadata.name';
const LARGE_REF_COUNT = 1001;

/**
 * Creates a JSON response suitable for the official Catalog client.
 * @param body - JSON-compatible response body.
 * @param status - HTTP status code.
 * @returns A fetch response with a JSON content type.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('BackstageCatalogApi', () => {
  it('should normalize discovery URLs and reject non-Catalog plugin discovery', async () => {
    expect(normalizeCatalogBaseUrl(`${TEST_BASE_URL}///`)).toBe(TEST_CATALOG_URL);
    const discovery = createCatalogDiscoveryApi(TEST_CATALOG_URL);
    await expect(discovery.getBaseUrl('catalog')).resolves.toBe(TEST_CATALOG_URL);
    await expect(discovery.getBaseUrl('auth')).rejects.toThrow(/Unsupported Backstage plugin/);
    expect(
      new BackstageCatalogApi({
        baseUrl: TEST_BASE_URL,
        auth: { type: 'bearer', token: 'token' },
      })
    ).toBeInstanceOf(BackstageCatalogApi);
  });
  it('should use the current entity query endpoint and encode supported query fields', async () => {
    let observedRequest: Request | undefined;
    const fetchImplementation: typeof globalThis.fetch = async (input, init) => {
      observedRequest = new Request(input, init);
      return jsonResponse({ items: [], totalItems: 0, pageInfo: {} });
    };
    const api = new BackstageCatalogApi({
      baseUrl: `${TEST_BASE_URL}/`,
      auth: { type: 'bearer', token: TEST_TOKEN },
      fetch: fetchImplementation,
    });

    await api.queryEntities({
      filter: [{ kind: ['Component', 'API'], 'metadata.namespace': 'default' }, { [METADATA_NAME_FIELD]: 'payments' }],
      fields: ['kind', METADATA_NAME_FIELD],
      orderFields: { field: METADATA_NAME_FIELD, order: 'asc' },
      fullTextFilter: { term: 'payments', fields: [METADATA_NAME_FIELD] },
      totalItems: 'exclude',
      limit: 20,
    });

    expect(observedRequest).toBeDefined();
    const requestUrl = new URL(observedRequest?.url ?? '');
    expect(requestUrl.pathname).toBe('/api/catalog/entities/by-query');
    expect(requestUrl.searchParams.getAll('filter')).toEqual([
      'kind=Component,kind=API,metadata.namespace=default',
      `${METADATA_NAME_FIELD}=payments`,
    ]);
    expect(requestUrl.searchParams.get('fields')).toBe(`kind,${METADATA_NAME_FIELD}`);
    expect(requestUrl.searchParams.getAll('orderField')).toEqual([`${METADATA_NAME_FIELD},asc`]);
    expect(requestUrl.searchParams.get('fullTextFilterTerm')).toBe('payments');
    expect(requestUrl.searchParams.get('fullTextFilterFields')).toBe(METADATA_NAME_FIELD);
    expect(requestUrl.searchParams.get('totalItems')).toBe('exclude');
    expect(requestUrl.searchParams.get('limit')).toBe('20');
    expect(observedRequest?.headers.get('authorization')).toBe(`Bearer ${TEST_TOKEN}`);
  });

  it('should resolve entity references through the current by-name endpoint', async () => {
    let observedRequest: Request | undefined;
    const fetchImplementation: typeof globalThis.fetch = async (input, init) => {
      observedRequest = new Request(input, init);
      return jsonResponse({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'payments', namespace: 'default' },
      });
    };
    const api = new BackstageCatalogApi({
      baseUrl: TEST_CATALOG_URL,
      auth: { type: 'bearer', token: TEST_TOKEN },
      fetch: fetchImplementation,
    });

    const entity = await api.getEntityByRef('component:default/payments');

    expect(entity?.metadata.name).toBe('payments');
    expect(new URL(observedRequest?.url ?? '').pathname).toBe(
      '/api/catalog/entities/by-name/component/default/payments'
    );
  });

  it('should send dry-run and conflict behavior as location query parameters', async () => {
    let observedRequest: Request | undefined;
    const fetchImplementation: typeof globalThis.fetch = async (input, init) => {
      observedRequest = new Request(input, init);
      return jsonResponse(
        {
          location: { id: 'location-1', type: 'url', target: 'https://example.com/catalog-info.yaml' },
          entities: [],
          exists: true,
        },
        201
      );
    };
    const api = new BackstageCatalogApi({
      baseUrl: TEST_BASE_URL,
      auth: { type: 'bearer', token: TEST_TOKEN },
      fetch: fetchImplementation,
    });

    await api.addLocation({
      target: 'https://example.com/catalog-info.yaml',
      dryRun: true,
      onConflict: 'refresh',
    });

    expect(observedRequest).toBeDefined();
    const requestUrl = new URL(observedRequest?.url ?? '');
    expect(requestUrl.pathname).toBe('/api/catalog/locations');
    expect(requestUrl.searchParams.get('dryRun')).toBe('true');
    expect(requestUrl.searchParams.get('onConflict')).toBe('refresh');
    expect(observedRequest?.method).toBe('POST');
    await expect(observedRequest?.json()).resolves.toEqual({
      type: 'url',
      target: 'https://example.com/catalog-info.yaml',
    });
  });

  it('should project, filter, chunk, and normalize entity-reference batches', async () => {
    const requests: Request[] = [];
    const fetchImplementation: typeof globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      const body = (await request.clone().json()) as { entityRefs: string[] };
      return jsonResponse({ items: body.entityRefs.map(() => null) });
    };
    const api = new BackstageCatalogApi({
      baseUrl: TEST_BASE_URL,
      auth: { type: 'bearer', token: TEST_TOKEN },
      fetch: fetchImplementation,
    });
    const entityRefs = Array.from({ length: LARGE_REF_COUNT }, (_, index) => `component:default/entity-${index}`);

    const response = await api.getEntitiesByRefs({
      entityRefs,
      fields: ['kind', METADATA_NAME_FIELD],
      filter: { kind: 'Component' },
    });

    expect(requests).toHaveLength(2);
    expect(response.items).toHaveLength(LARGE_REF_COUNT);
    expect(response.items.every((entity) => entity === undefined)).toBe(true);
    const firstRequest = requests[0];
    const firstBody = (await firstRequest.clone().json()) as Record<string, unknown>;
    expect(new URL(firstRequest.url).searchParams.getAll('filter')).toEqual(['kind=Component']);
    expect(firstBody).toMatchObject({ fields: ['kind', METADATA_NAME_FIELD] });
  });

  it('should use canonical ancestry, facet, location, and validation wire shapes', async () => {
    const requests: Request[] = [];
    const location = { id: 'location-1', type: 'url', target: 'https://example.test/catalog-info.yaml' };
    const fetchImplementation: typeof globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (new URL(request.url).pathname.endsWith('/locations')) return jsonResponse([{ data: location }]);
      return jsonResponse({ facets: {}, rootEntityRef: TEST_ENTITY_REF, items: [] });
    };
    const api = new BackstageCatalogApi({
      baseUrl: TEST_BASE_URL,
      auth: { type: 'bearer', token: TEST_TOKEN },
      fetch: fetchImplementation,
    });
    const entity = { apiVersion: 'backstage.io/v1alpha1', kind: 'Component', metadata: { name: 'api' } };

    await api.getEntityAncestors({ entityRef: TEST_ENTITY_REF });
    await api.getEntityFacets({ facets: ['kind', 'spec.type'], filter: { kind: 'Component' } });
    await api.getLocationByEntity(TEST_ENTITY_REF);
    await expect(api.getLocationByRef(`url:${location.target}`)).resolves.toEqual(location);
    await expect(api.validateEntity(entity, `url:${location.target}`)).resolves.toEqual({ valid: true });

    const urls = requests.map((request) => new URL(request.url));
    expect(urls.map(({ pathname }) => pathname)).toEqual([
      '/api/catalog/entities/by-name/component/default/api/ancestry',
      '/api/catalog/entity-facets',
      '/api/catalog/locations/by-entity/component/default/api',
      '/api/catalog/locations',
      '/api/catalog/validate-entity',
    ]);
    expect(urls[1].searchParams.getAll('facet')).toEqual(['kind', 'spec.type']);
    expect(urls[1].searchParams.getAll('filter')).toEqual(['kind=Component']);
    const validationBody = await requests[4].clone().json();
    expect(validationBody).toEqual({ entity, location: `url:${location.target}` });
  });

  it('should delegate the complete supported Catalog client surface', async () => {
    const requests: Request[] = [];
    const fetchImplementation: typeof globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (request.method === 'DELETE') return new Response(null, { status: 204 });
      if (request.method === 'GET' && new URL(request.url).pathname.endsWith('/locations')) {
        return jsonResponse([]);
      }
      return jsonResponse({ items: [], facets: {}, rootEntityRef: TEST_ENTITY_REF });
    };
    const api = new BackstageCatalogApi({
      baseUrl: TEST_BASE_URL,
      auth: { type: 'bearer', token: 'default-token' },
      fetch: fetchImplementation,
    });

    await api.getEntitiesByRefs({ entityRefs: [TEST_ENTITY_REF] });
    await api.getEntityAncestors({ entityRef: TEST_ENTITY_REF });
    await api.removeEntityByUid('entity-uid');
    await api.refreshEntity(TEST_ENTITY_REF);
    await api.getEntityFacets({ facets: ['kind'] });
    await api.getLocationById('location-id');
    await api.getLocationByRef('url:https://example.test/catalog-info.yaml');
    await api.removeLocationById('location-id');
    await api.getLocationByEntity(TEST_ENTITY_REF);
    await api.validateEntity(
      { apiVersion: 'backstage.io/v1alpha1', kind: 'Component', metadata: { name: 'api' } },
      'url:https://example.test/catalog-info.yaml'
    );
    await api.queryEntities({}, { token: 'request-token' });

    expect(requests).toHaveLength(11);
    expect(requests.at(-1)?.headers.get('authorization')).toBe('Bearer request-token');
    expect(requests.filter(({ method }) => method === 'DELETE')).toHaveLength(2);
  });
});
