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
import { ApiStatus } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { GetEntitiesByRefsTool } from './get_entities_by_refs.tool.js';

describe('GetEntitiesByRefsTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      getEntitiesByRefs: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  });

  describe('execute', () => {
    it('should call the catalog client getEntitiesByRefs method with string entityRefs', async () => {
      const request = {
        entityRefs: ['component:default/comp1', 'component:default/comp2'],
      };

      const entitiesResult = {
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'comp1', namespace: 'default' },
          },
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'comp2', namespace: 'default' },
          },
        ],
      };

      mockCatalogClient.getEntitiesByRefs.mockResolvedValueOnce(entitiesResult);

      const result = await GetEntitiesByRefsTool.execute(request, mockContext);

      expect(mockCatalogClient.getEntitiesByRefs).toHaveBeenCalledWith({
        entityRefs: ['component:default/comp1', 'component:default/comp2'],
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe(ApiStatus.SUCCESS);
      expect(responseData.data).toEqual(entitiesResult);
    });

    it('should call the catalog client getEntitiesByRefs method with compound entityRefs', async () => {
      const request = {
        entityRefs: [
          { kind: 'component', namespace: 'default', name: 'comp1' },
          { kind: 'component', namespace: 'default', name: 'comp2' },
        ],
      };

      const entitiesResult = {
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'comp1', namespace: 'default' },
          },
        ],
      };

      mockCatalogClient.getEntitiesByRefs.mockResolvedValueOnce(entitiesResult);

      const result = await GetEntitiesByRefsTool.execute(request, mockContext);

      expect(mockCatalogClient.getEntitiesByRefs).toHaveBeenCalledWith({
        entityRefs: ['component:default/comp1', 'component:default/comp2'],
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe(ApiStatus.SUCCESS);
      expect(responseData.data).toEqual(entitiesResult);
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        entityRefs: ['component:default/nonexistent'],
      };

      const error = new Error('Some entities not found');
      mockCatalogClient.getEntitiesByRefs.mockRejectedValue(error);

      const result = await GetEntitiesByRefsTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe(ApiStatus.ERROR);
      expect(errorData.data.message).toBe('Some entities not found');
    });
  });
});
