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
import { QueryEntitiesResponse } from '@backstage/catalog-client';
import { jest } from '@jest/globals';

import { IBackstageCatalogApi } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { GetEntitiesByQueryTool } from './get_entities_by_query.tool.js';

describe('GetEntitiesByQueryTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      queryEntities: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  });

  describe('execute', () => {
    it('should call the catalog client queryEntities method with filter', async () => {
      const request = {
        filter: [
          { key: 'kind', values: ['Component'] },
          { key: 'spec.type', values: ['service'] },
        ],
        limit: 10,
      };

      const queryResult = {
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'comp1', namespace: 'default' },
            spec: { type: 'service' },
          },
        ],
        totalItems: 1,
        hasMore: false,
        pageInfo: { nextCursor: undefined, prevCursor: undefined },
      };

      mockCatalogClient.queryEntities.mockResolvedValue(queryResult);

      const result = await GetEntitiesByQueryTool.execute(request, mockContext);

      expect(mockCatalogClient.queryEntities).toHaveBeenCalledWith(request);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(queryResult);
    });

    it('should call the catalog client queryEntities method with ordering', async () => {
      const request = {
        filter: [{ key: 'kind', values: ['Component'] }],
        order: { field: 'metadata.name', order: 'asc' as const },
        limit: 5,
        offset: 0,
      };

      const queryResult: QueryEntitiesResponse = {
        items: [],
        totalItems: 0,
        pageInfo: {
          nextCursor: undefined,
          prevCursor: undefined,
        },
      };

      mockCatalogClient.queryEntities.mockResolvedValue(queryResult);

      const result = await GetEntitiesByQueryTool.execute(request, mockContext);

      expect(mockCatalogClient.queryEntities).toHaveBeenCalledWith(request);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(queryResult);
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        filter: [{ key: 'kind', values: ['InvalidKind'] }],
      };

      const error = new Error('Query failed');
      mockCatalogClient.queryEntities.mockRejectedValue(error);

      const result = await GetEntitiesByQueryTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Query failed');
    });
  });
});
