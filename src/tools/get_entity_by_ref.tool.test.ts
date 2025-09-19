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
import { Entity } from '@backstage/catalog-model';
import { jest } from '@jest/globals';

import { ApiStatus, IBackstageCatalogApi } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { GetEntityByRefTool } from './get_entity_by_ref.tool.js';

// Mock the inputSanitizer
jest.mock('../auth/input-sanitizer.js', () => ({
  inputSanitizer: {
    sanitizeEntityRef: jest.fn(),
  },
}));

import { inputSanitizer } from '../auth/input-sanitizer.js';

describe('GetEntityByRefTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;
  let sanitizeEntityRefSpy: jest.SpiedFunction<typeof inputSanitizer.sanitizeEntityRef>;

  beforeEach(() => {
    mockCatalogClient = {
      getEntityByRef: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;

    // Spy on the sanitizeEntityRef method
    sanitizeEntityRefSpy = jest.spyOn(inputSanitizer, 'sanitizeEntityRef');
    sanitizeEntityRefSpy.mockImplementationOnce(
      (ref: string | { kind: string; namespace: string; name: string }) => ref
    );
  });

  describe('execute', () => {
    it('should call the catalog client getEntityByRef method with string entityRef', async () => {
      const request = {
        entityRef: 'component:default/my-component',
      };

      const expectedEntity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component', namespace: 'default' },
        spec: { type: 'service' },
      };
      mockCatalogClient.getEntityByRef.mockResolvedValueOnce(expectedEntity);

      const result = await GetEntityByRefTool.execute(request, mockContext);

      expect(inputSanitizer.sanitizeEntityRef).toHaveBeenCalledWith('component:default/my-component');
      expect(mockCatalogClient.getEntityByRef).toHaveBeenCalledWith('component:default/my-component');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData).toEqual({
        data: {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'my-component',
            namespace: 'default',
          },
          spec: {
            type: 'service',
          },
        },
        status: ApiStatus.SUCCESS,
      });
    });

    it('should call the catalog client getEntityByRef method with compound entityRef', async () => {
      const request = {
        entityRef: {
          kind: 'Component',
          namespace: 'default',
          name: 'my-component',
        },
      };

      const expectedEntity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component', namespace: 'default' },
        spec: { type: 'service' },
      };
      mockCatalogClient.getEntityByRef.mockResolvedValueOnce(expectedEntity);

      const result = await GetEntityByRefTool.execute(request, mockContext);

      expect(inputSanitizer.sanitizeEntityRef).toHaveBeenCalledWith({
        kind: 'Component',
        namespace: 'default',
        name: 'my-component',
      });
      expect(mockCatalogClient.getEntityByRef).toHaveBeenCalledWith({
        kind: 'Component',
        namespace: 'default',
        name: 'my-component',
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData).toEqual({
        data: {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'my-component',
            namespace: 'default',
          },
          spec: {
            type: 'service',
          },
        },
        status: ApiStatus.SUCCESS,
      });
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        entityRef: 'component:default/nonexistent',
      };

      const error = new Error('Entity not found');
      mockCatalogClient.getEntityByRef.mockRejectedValueOnce(error);

      const result = await GetEntityByRefTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData).toMatchObject({
        data: {
          code: 'NOT_FOUND',
          message: 'Entity not found',
          source: {
            operation: 'get_entity_by_ref',
            tool: 'get_entity_by_ref',
          },
        },
        errors: [
          {
            code: 'NOT_FOUND',
            detail: 'Entity not found',
            meta: {
              args: {
                entityRef: 'component:default/nonexistent',
              },
              tool: 'get_entity_by_ref',
            },
            source: {
              parameter: 'get_entity_by_ref',
            },
            status: '404',
            title: 'Resource Not Found',
          },
        ],
        status: ApiStatus.ERROR,
      });
    });
  });
});
