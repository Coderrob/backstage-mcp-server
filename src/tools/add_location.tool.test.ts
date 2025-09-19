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
import { AddLocationRequest, AddLocationResponse } from '@backstage/catalog-client';

import { ToolTestHelper } from '../test/tool-test-helper.js';
import { AddLocationTool } from './add_location.tool.js';

describe('AddLocationTool', () => {
  ToolTestHelper.setupTestEnvironment();

  let mockCatalogClient: ReturnType<typeof ToolTestHelper.createMockCatalogClient>;
  let mockContext: ReturnType<typeof ToolTestHelper.createMockContext>;

  beforeEach(() => {
    mockCatalogClient = ToolTestHelper.createMockCatalogClient();
    mockContext = ToolTestHelper.createMockContext(mockCatalogClient);
  });

  describe('execute', () => {
    it('should call the catalog client addLocation method with correct parameters', async () => {
      const request: AddLocationRequest = {
        type: 'github',
        target: 'https://github.com/example/repo',
      };

      const expectedResponse: AddLocationResponse = {
        location: { id: 'location-123', type: 'github', target: 'https://github.com/example/repo' },
        entities: [],
      };
      mockCatalogClient.addLocation.mockResolvedValue(expectedResponse);

      const result = await AddLocationTool.execute(request, mockContext);

      expect(mockCatalogClient.addLocation).toHaveBeenCalledWith(request);
      ToolTestHelper.expectSuccessResponse(result, expectedResponse);
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        type: 'github',
        target: 'https://github.com/example/repo',
      };

      const error = new Error('Location already exists');
      mockCatalogClient.addLocation.mockRejectedValue(error);

      const result = await AddLocationTool.execute(request, mockContext);

      ToolTestHelper.expectErrorResponse(result, 'Location already exists', 'CONFLICT');
    });
  });
});
