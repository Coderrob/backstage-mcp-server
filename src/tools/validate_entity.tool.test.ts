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
import { ValidateEntityTool } from './validate_entity.tool.js';

describe('ValidateEntityTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      validateEntity: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as IToolRegistrationContext;
  });

  describe('execute', () => {
    it('should call the catalog client validateEntity method with correct parameters', async () => {
      const entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component' },
        spec: { type: 'service' },
      };

      const request = {
        entity,
        locationRef: 'github:https://github.com/example/repo',
      };

      const validationResult = {
        valid: true,
        errors: [],
      };

      mockCatalogClient.validateEntity.mockResolvedValue(validationResult);

      const result = await ValidateEntityTool.execute(request, mockContext);

      expect(mockCatalogClient.validateEntity).toHaveBeenCalledWith(entity, 'github:https://github.com/example/repo');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(validationResult);
    });

    it('should handle validation errors', async () => {
      const entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component' },
        spec: { type: 'invalid-type' },
      };

      const request = {
        entity,
        locationRef: 'github:https://github.com/example/repo',
      };

      const error = new Error('Invalid entity structure');
      mockCatalogClient.validateEntity.mockRejectedValue(error);

      const result = await ValidateEntityTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Invalid entity structure');
    });
  });
});
