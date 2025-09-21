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
import { jest } from '@jest/globals';

import { JsonApiResource } from '../../shared/types/apis.js';
import { EntityField } from '../../shared/types/constants.js';
import { JsonApiFormatter } from './jsonapi-formatter.js';

describe('JsonApiFormatter', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('entityToResource', () => {
    it('should convert basic entity to resource', () => {
      const entity = {
        [EntityField.KIND]: 'Component',
        [EntityField.NAMESPACE]: 'default',
        [EntityField.NAME]: 'my-comp',
        [EntityField.METADATA]: {
          title: 'My Component',
          description: 'A test component',
          tags: ['tag1', 'tag2'],
        },
        [EntityField.SPEC]: { type: 'service' },
      };

      const result = JsonApiFormatter.entityToResource(entity);

      expect(result.id).toBe('component:default:my-comp');
      expect(result.type).toBe('component');
      expect(result.attributes).toEqual({
        title: 'My Component',
        description: 'A test component',
        tags: ['tag1', 'tag2'],
        type: 'service',
        annotations: {},
        labels: {},
      });
      expect(result.links?.self).toBe('/api/catalog/entities/component/default/my-comp');
      expect(result.meta).toEqual({
        namespace: 'default',
        kind: 'Component',
        name: 'my-comp',
      });
    });

    it('should handle entity with defaults', () => {
      const entity = {};

      const result = JsonApiFormatter.entityToResource(entity);

      expect(result.id).toBe('unknown:default:unnamed');
      expect(result.type).toBe('entity');
      expect(result.attributes).toEqual({});
      expect(result.links?.self).toBe('/api/catalog/entities/entity/default/');
    });

    it('should handle entity with relations', () => {
      const entity = {
        [EntityField.KIND]: 'Component',
        [EntityField.NAMESPACE]: 'default',
        [EntityField.NAME]: 'my-comp',
        relations: [
          {
            type: 'dependsOn',
            targetRef: {
              kind: 'API',
              namespace: 'default',
              name: 'my-api',
            },
          },
        ],
      };

      const result = JsonApiFormatter.entityToResource(entity);

      expect(result.relationships).toEqual({
        dependson: {
          data: {
            id: 'api:default:my-api',
            type: 'api',
          },
        },
      });
    });
  });

  describe('entitiesToDocument', () => {
    it('should convert entities to document', () => {
      const entities = [
        {
          [EntityField.KIND]: 'Component',
          [EntityField.NAMESPACE]: 'default',
          [EntityField.NAME]: 'comp1',
        },
        {
          [EntityField.KIND]: 'API',
          [EntityField.NAMESPACE]: 'default',
          [EntityField.NAME]: 'api1',
        },
      ];

      const result = JsonApiFormatter.entitiesToDocument(entities);

      expect((result.data as JsonApiResource[]).length).toBe(2);
      expect((result.data as JsonApiResource[])[0].type).toBe('component');
      expect((result.data as JsonApiResource[])[1].type).toBe('api');
      expect(result.jsonapi?.version).toBe('1.0');
      expect(result.meta?.total).toBe(2);
    });

    it('should handle pagination', () => {
      const entities = [
        {
          [EntityField.KIND]: 'Component',
          [EntityField.NAMESPACE]: 'default',
          [EntityField.NAME]: 'comp1',
        },
      ];

      const result = JsonApiFormatter.entitiesToDocument(entities, {
        limit: 10,
        offset: 0,
        total: 25,
      });

      expect(result.links?.self).toBe('/api/catalog/entities?limit=10&offset=0');
      expect(result.links?.next).toBe('/api/catalog/entities?limit=10&offset=10');
      expect(result.links?.last).toBe('/api/catalog/entities?limit=10&offset=20');
      expect(result.meta?.pagination).toEqual({
        limit: 10,
        offset: 0,
        total: 25,
      });
    });
  });

  describe('locationToResource', () => {
    it('should convert location to resource', () => {
      const location = {
        id: 1,
        type: 'github',
        target: 'https://github.com/user/repo',
        tags: ['tag1'],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
      };

      const result = JsonApiFormatter.locationToResource(location);

      expect(result.id).toBe('1');
      expect(result.type).toBe('location');
      expect(result.attributes).toEqual({
        type: 'github',
        target: 'https://github.com/user/repo',
        tags: ['tag1'],
      });
      expect(result.links?.self).toBe('/api/catalog/locations/1');
      expect(result.meta).toEqual({
        createdAt: '2023-01-01',
        updatedAt: '2023-01-02',
      });
    });

    it('should handle location with defaults', () => {
      const location = {};

      const result = JsonApiFormatter.locationToResource(location);

      expect(result.id).toBe('');
      expect(result.attributes).toEqual({
        tags: [],
      });
      expect(result.links?.self).toBe('/api/catalog/locations/');
    });
  });

  describe('createErrorDocument', () => {
    it('should create error document with Error', () => {
      const error = new Error('Test error');
      const result = JsonApiFormatter.createErrorDocument(error, '400', 'VALIDATION_ERROR');

      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]).toEqual({
        status: '400',
        code: 'VALIDATION_ERROR',
        title: 'Internal Server Error',
        detail: 'Test error',
      });
      expect(result.jsonapi?.version).toBe('1.0');
    });

    it('should create error document with string', () => {
      const result = JsonApiFormatter.createErrorDocument('String error');

      expect(result.errors?.[0].detail).toBe('String error');
      expect(result.errors?.[0].status).toBe('500');
      expect(result.errors?.[0].code).toBe('INTERNAL_ERROR');
    });
  });

  describe('createSuccessDocument', () => {
    it('should create success document with data', () => {
      const data = { id: '1', type: 'component' };
      const meta = { total: 1 };
      const result = JsonApiFormatter.createSuccessDocument(data, meta);

      expect(result.data).toBe(data);
      expect(result.meta).toBe(meta);
      expect(result.jsonapi?.version).toBe('1.0');
    });

    it('should create success document without data', () => {
      const result = JsonApiFormatter.createSuccessDocument(undefined);

      expect(result.data).toBeUndefined();
      expect(result.jsonapi?.version).toBe('1.0');
    });
  });
});
