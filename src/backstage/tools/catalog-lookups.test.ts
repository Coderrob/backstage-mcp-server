import type { Entity } from '@backstage/catalog-model';
import { describe, expect, it, vi } from 'vitest';

import { domainInventoryInputSchema, findUsersInputSchema, systemLookupInputSchema } from '../../shared/schema.js';
import type { UserLookupFixtureSpec } from '../../types/backstage-testing.js';
import type { CatalogQuery } from '../../types/index.js';
import {
  collectDescendants,
  findUsers,
  queryEntitiesByAnnotation,
  queryRelatedEntities,
  searchEntitiesByName,
} from './catalog-lookups.js';

const DOMAIN_REF = 'domain:default/root';
const EMPTY = { items: [], totalItems: 0, pageInfo: {} };
/** Creates a standard User fixture with optional runtime profile data. */
function user(name: string, spec?: UserLookupFixtureSpec): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'User',
    metadata: { name },
    spec: spec ? { ...spec } : undefined,
  };
}
/** Creates a minimal containment fixture. */
function entity(kind: string, name: string): Entity {
  return { apiVersion: 'backstage.io/v1alpha1', kind, metadata: { name } };
}

describe('Catalog lookup algorithms', () => {
  it('should find name combinations across pages without assuming name order', async () => {
    const jane = user('jane', { profile: { displayName: 'Doe, Jane Mary' } });
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({
        items: [user('other', { profile: { displayName: 'Jane Smith' } })],
        totalItems: 2,
        pageInfo: { nextCursor: 'next' },
      })
      .mockResolvedValueOnce({ items: [jane, jane], totalItems: 2, pageInfo: {} });
    expect(await findUsers(query, { name: { firstName: 'JANE', lastName: 'Doe' }, namespace: 'people' })).toEqual([
      jane,
    ]);
    expect(query).toHaveBeenNthCalledWith(1, { filter: { kind: 'User', 'metadata.namespace': 'people' }, limit: 500 });
    expect(query).toHaveBeenNthCalledWith(2, { cursor: 'next', limit: 500 });
  });
  it('should handle absent and malformed profiles and normalize whitespace', async () => {
    const valid = user('valid', { profile: { displayName: '  Mary   Jane Doe ' } });
    const response = {
      ...EMPTY,
      items: [
        user('missing'),
        user('null', { profile: null }),
        user('array', { profile: [] }),
        user('number', { profile: 7 }),
        user('empty', { profile: {} }),
        user('invalid', { profile: { displayName: 7 } }),
        valid,
      ],
    };
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce(response);
    expect(await findUsers(query, { name: { firstName: 'Mary Jane' } })).toEqual([valid]);
    expect(await findUsers(query, { name: { lastName: 'DOE' } })).toEqual([valid]);
    expect(await findUsers(query, { name: { lastName: 'absent' } })).toEqual([]);
  });
  it('should follow descendants with deduplication and cycle protection', async () => {
    const domain = entity('Domain', 'root');
    const system = entity('System', 'one');
    const component = entity('Component', 'two');
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({ ...EMPTY, items: [system], pageInfo: { nextCursor: 'next' } })
      .mockResolvedValueOnce({ ...EMPTY, items: [system, domain] })
      .mockResolvedValueOnce({ ...EMPTY, items: [component] })
      .mockResolvedValueOnce({ ...EMPTY, items: [system] });
    expect(await collectDescendants(query, { relation: 'partOf', targetRef: DOMAIN_REF, recursive: true })).toEqual([
      system,
      component,
    ]);
    expect(query).toHaveBeenNthCalledWith(1, { filter: { 'relations.partOf': DOMAIN_REF }, limit: 500 });
    expect(query).toHaveBeenNthCalledWith(3, { filter: { 'relations.partOf': 'system:default/one' }, limit: 500 });
    expect(query).toHaveBeenCalledTimes(4);
  });
  it('should support direct scope and empty inventories', async () => {
    const child = entity('API', 'one');
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({ ...EMPTY, items: [child] })
      .mockResolvedValueOnce(EMPTY);
    const input = { relation: 'partOf', targetRef: 'system:prod/root', recursive: false };
    expect(await collectDescendants(query, input)).toEqual([child]);
    expect(query).toHaveBeenCalledOnce();
    expect(await collectDescendants(query, input)).toEqual([]);
  });
  it('should stop repeated cursors without returning a partial success', async () => {
    const query = vi.fn<CatalogQuery>();
    for (let page = 0; page < 100; page++)
      query.mockResolvedValueOnce({ ...EMPTY, pageInfo: { nextCursor: 'repeat' } });
    await expect(findUsers(query, { name: { firstName: 'Jane' } })).rejects.toThrow('request budget');
    expect(query).toHaveBeenCalledTimes(100);
  });
  it('should bound aggregate entity volume and propagate upstream failures', async () => {
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({ ...EMPTY, items: Array.from({ length: 10001 }, () => entity('System', 'one')) });
    await expect(
      collectDescendants(query, { relation: 'partOf', targetRef: DOMAIN_REF, recursive: true })
    ).rejects.toThrow('entity budget');
    query.mockRejectedValueOnce(new Error('upstream'));
    await expect(findUsers(query, { name: { lastName: 'Doe' } })).rejects.toThrow('upstream');
  });
  it('should require searchable names and constrain scope identity', () => {
    for (const input of [{}, { name: {} }, { name: { firstName: ' ' } }, { name: { lastName: '' } }]) {
      expect(findUsersInputSchema.safeParse(input).success).toBe(false);
    }
    expect(findUsersInputSchema.parse({ name: { firstName: ' Jane ' } }).name.firstName).toBe('Jane');
    expect(systemLookupInputSchema.safeParse({ systemRef: DOMAIN_REF }).success).toBe(false);
    expect(domainInventoryInputSchema.parse({ domainRef: DOMAIN_REF }).recursive).toBe(true);
  });
  it('should query a directional relation across pages with kind constraints and deduplication', async () => {
    const api = entity('API', 'orders');
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({ ...EMPTY, items: [api], pageInfo: { nextCursor: 'next' } })
      .mockResolvedValueOnce({ ...EMPTY, items: [api] });
    expect(
      await queryRelatedEntities(query, {
        relation: 'apiProvidedBy',
        targetRef: 'component:default/provider',
        kind: 'API',
      })
    ).toEqual([api]);
    expect(query).toHaveBeenNthCalledWith(1, {
      filter: { 'relations.apiProvidedBy': 'component:default/provider', kind: 'API' },
      limit: 500,
    });
    expect(query).toHaveBeenNthCalledWith(2, { cursor: 'next', limit: 500 });
  });

  it('should traverse through nonmatching subdomains to find matching Systems', async () => {
    const nested = entity('Domain', 'nested');
    const system = entity('System', 'billing');
    const other = entity('Component', 'frontend');
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({ ...EMPTY, items: [nested, other] })
      .mockResolvedValueOnce({ ...EMPTY, items: [system, nested] })
      .mockResolvedValueOnce(EMPTY);
    expect(
      await collectDescendants(query, {
        relation: 'partOf',
        targetRef: DOMAIN_REF.toUpperCase(),
        kind: 'System',
        recursive: true,
      })
    ).toEqual([system]);
    expect(query).toHaveBeenNthCalledWith(1, { filter: { 'relations.partOf': DOMAIN_REF }, limit: 500 });
    expect(query).toHaveBeenNthCalledWith(2, {
      filter: { 'relations.partOf': ['domain:default/nested', 'component:default/frontend'] },
      limit: 500,
    });
    expect(query).toHaveBeenCalledTimes(3);
  });

  it('should batch wide System inventories without dropping later children', async () => {
    const children = Array.from({ length: 51 }, (_, index) => entity('Component', `child-${String(index)}`));
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({ ...EMPTY, items: children })
      .mockResolvedValueOnce(EMPTY)
      .mockResolvedValueOnce(EMPTY);
    expect(
      await collectDescendants(query, {
        relation: 'partOf',
        targetRef: 'system:default/wide',
        recursive: true,
      })
    ).toEqual(children);
    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(2, {
      filter: { 'relations.partOf': children.slice(0, 50).map((child) => `component:default/${child.metadata.name}`) },
      limit: 500,
    });
    expect(query).toHaveBeenNthCalledWith(3, {
      filter: { 'relations.partOf': 'component:default/child-50' },
      limit: 500,
    });
  });

  it('should expand Group descendants without following unrelated kinds', async () => {
    const child = entity('Group', 'child');
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({ ...EMPTY, items: [child] })
      .mockResolvedValueOnce(EMPTY);
    expect(
      await collectDescendants(query, {
        relation: 'childOf',
        targetRef: 'group:default/parent',
        kind: ['Group'],
        recursive: true,
      })
    ).toEqual([child]);
    expect(query).toHaveBeenNthCalledWith(2, {
      filter: { 'relations.childOf': 'group:default/child' },
      limit: 500,
    });
  });

  it('should search explicit name fields and carry namespace and kind only on the first page', async () => {
    const component = entity('Component', 'catalog-ui');
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({ ...EMPTY, items: [component], pageInfo: { nextCursor: 'next' } })
      .mockResolvedValueOnce({ ...EMPTY, items: [component] });
    expect(await searchEntitiesByName(query, { name: 'catalog', kind: 'Component', namespace: 'team' })).toEqual([
      component,
    ]);
    expect(query).toHaveBeenNthCalledWith(1, {
      fullTextFilter: { term: 'catalog', fields: ['metadata.name', 'metadata.title'] },
      filter: { kind: 'Component', 'metadata.namespace': 'team' },
      limit: 500,
    });
    expect(query).toHaveBeenNthCalledWith(2, { cursor: 'next', limit: 500 });
  });

  it('should support unconstrained name and exact annotation searches', async () => {
    const item = entity('Component', 'one');
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce({ ...EMPTY, items: [item] })
      .mockResolvedValueOnce({ ...EMPTY, items: [item] });
    expect(await searchEntitiesByName(query, { name: 'one' })).toEqual([item]);
    expect(query).toHaveBeenNthCalledWith(1, {
      fullTextFilter: { term: 'one', fields: ['metadata.name', 'metadata.title'] },
      limit: 500,
    });
    expect(
      await queryEntitiesByAnnotation(query, {
        key: 'backstage.io/orphan',
        value: 'true',
        kind: 'Component',
        namespace: 'team',
      })
    ).toEqual([item]);
    expect(query).toHaveBeenNthCalledWith(2, {
      filter: { 'metadata.annotations.backstage.io/orphan': 'true', kind: 'Component', 'metadata.namespace': 'team' },
      limit: 500,
    });
  });

  it('should apply shared bounds to relation, name and annotation lookups', async () => {
    const tooMany = { ...EMPTY, items: Array.from({ length: 10001 }, () => entity('Component', 'one')) };
    const query = vi
      .fn<CatalogQuery>()
      .mockResolvedValueOnce(tooMany)
      .mockResolvedValueOnce(tooMany)
      .mockResolvedValueOnce(tooMany);
    await expect(queryRelatedEntities(query, { relation: 'ownedBy', targetRef: 'group:default/team' })).rejects.toThrow(
      'entity budget'
    );
    await expect(searchEntitiesByName(query, { name: 'one' })).rejects.toThrow('entity budget');
    await expect(queryEntitiesByAnnotation(query, { key: 'backstage.io/orphan', value: 'true' })).rejects.toThrow(
      'entity budget'
    );
  });
});
