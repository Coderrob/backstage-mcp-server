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

import { IBackstageCatalogApi } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { GetEntityAncestorsTool } from './get_entity_ancestors.tool.js';

describe('GetEntityAncestorsTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      getEntityAncestors: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as IToolRegistrationContext;
  });

  describe('execute', () => {
    it('should call the catalog client getEntityAncestors method with string entityRef', async () => {
      const request = {
        entityRef: 'component:default/my-component',
      };

      const ancestorsResult = {
        rootEntityRef: 'system:default/my-system',
        items: [
          {
            entity: {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'Domain',
              metadata: { name: 'my-domain', namespace: 'default' },
            },
            parentEntityRefs: [],
          },
          {
            entity: {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'System',
              metadata: { name: 'my-system', namespace: 'default' },
            },
            parentEntityRefs: ['domain:default/my-domain'],
          },
        ],
      };

      mockCatalogClient.getEntityAncestors.mockResolvedValue(ancestorsResult);

      const result = await GetEntityAncestorsTool.execute(request, mockContext);

      expect(mockCatalogClient.getEntityAncestors).toHaveBeenCalledWith({
        entityRef: 'component:default/my-component',
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(ancestorsResult);
    });

    it('should call the catalog client getEntityAncestors method with compound entityRef', async () => {
      const request = {
        entityRef: {
          kind: 'component',
          namespace: 'default',
          name: 'my-component',
        },
      };

      const ancestorsResult = {
        rootEntityRef: 'system:default/my-system',
        items: [
          {
            entity: {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'Domain',
              metadata: { name: 'my-domain', namespace: 'default' },
            },
            parentEntityRefs: [],
          },
          {
            entity: {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'System',
              metadata: { name: 'my-system', namespace: 'default' },
            },
            parentEntityRefs: ['domain:default/my-domain'],
          },
        ],
      };

      mockCatalogClient.getEntityAncestors.mockResolvedValue(ancestorsResult);

      const result = await GetEntityAncestorsTool.execute(request, mockContext);

      expect(mockCatalogClient.getEntityAncestors).toHaveBeenCalledWith({
        entityRef: 'component:default/my-component',
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(ancestorsResult);
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        entityRef: 'component:default/my-component',
      };

      const error = new Error('Failed to get entity ancestors');
      mockCatalogClient.getEntityAncestors.mockRejectedValue(error);

      const result = await GetEntityAncestorsTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Failed to get entity ancestors');
    });
  });
});
