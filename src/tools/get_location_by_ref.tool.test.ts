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
import { GetLocationByRefTool } from './get_location_by_ref.tool.js';

describe('GetLocationByRefTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      getLocationByRef: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  });

  describe('execute', () => {
    it('should call the catalog client getLocationByRef method with correct parameters', async () => {
      const request = {
        locationRef: 'github:https://github.com/example/repo',
      };

      const expectedLocation = {
        id: 'location-123',
        type: 'github',
        target: 'https://github.com/example/repo',
      };
      mockCatalogClient.getLocationByRef.mockResolvedValueOnce(expectedLocation);

      const result = await GetLocationByRefTool.execute(request, mockContext);

      expect(mockCatalogClient.getLocationByRef).toHaveBeenCalledWith('github:https://github.com/example/repo');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData).toEqual({
        data: {
          id: 'location-123',
          target: 'https://github.com/example/repo',
          type: 'github',
        },
        status: 'success',
      });
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        locationRef: 'invalid:location',
      };

      const error = new Error('Location not found');
      mockCatalogClient.getLocationByRef.mockRejectedValue(error);

      const result = await GetLocationByRefTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe(ApiStatus.ERROR);
      expect(errorData.data.message).toBe('Location not found');
    });
  });
});
