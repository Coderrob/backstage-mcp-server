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
import { GetEntityFacetsTool } from './get_entity_facets.tool.js';

describe('GetEntityFacetsTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      getEntityFacets: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  });

  describe('execute', () => {
    it('should call the catalog client getEntityFacets method with facets only', async () => {
      const request = {
        facets: ['kind', 'spec.type'],
      };

      const facetsResult = {
        facets: {
          kind: [
            { value: 'Component', count: 10 },
            { value: 'API', count: 5 },
          ],
          'spec.type': [
            { value: 'service', count: 8 },
            { value: 'website', count: 7 },
          ],
        },
      };

      mockCatalogClient.getEntityFacets.mockResolvedValue(facetsResult);

      const result = await GetEntityFacetsTool.execute(request, mockContext);

      expect(mockCatalogClient.getEntityFacets).toHaveBeenCalledWith(request);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(facetsResult);
    });

    it('should call the catalog client getEntityFacets method with filter and facets', async () => {
      const request = {
        filter: [{ key: 'kind', values: ['Component'] }],
        facets: ['spec.type'],
      };

      const facetsResult = {
        facets: {
          'spec.type': [
            { value: 'service', count: 8 },
            { value: 'website', count: 2 },
          ],
        },
      };

      mockCatalogClient.getEntityFacets.mockResolvedValue(facetsResult);

      const result = await GetEntityFacetsTool.execute(request, mockContext);

      expect(mockCatalogClient.getEntityFacets).toHaveBeenCalledWith(request);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(facetsResult);
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        facets: ['kind'],
      };

      const error = new Error('Failed to get facets');
      mockCatalogClient.getEntityFacets.mockRejectedValue(error);

      const result = await GetEntityFacetsTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Failed to get facets');
    });
  });
});
