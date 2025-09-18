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
import { GetEntitiesResponse } from '@backstage/catalog-client';
import { jest } from '@jest/globals';

import { inputSanitizer } from '../auth/input-sanitizer.js';
import { IBackstageCatalogApi } from '../types/apis.js';
import { JsonApiDocument } from '../types/json-api.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { GetEntitiesTool } from './get_entities.tool.js';

// Mock the inputSanitizer
jest.mock('../auth/input-sanitizer.js', () => ({
  inputSanitizer: {
    sanitizeFilter: jest.fn(),
    sanitizeArray: jest.fn(),
    sanitizeString: jest.fn(),
  },
}));

// Define types that match the tool's parameter schema
interface EntityFilter {
  key: string;
  values: string[];
}

interface ToolGetEntitiesRequest {
  filter?: EntityFilter[];
  fields?: string[];
  limit?: number;
  offset?: number;
  format: 'standard' | 'jsonapi'; // Required, not optional
}

describe('GetEntitiesTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;
  let sanitizeFilterSpy: jest.SpiedFunction<typeof inputSanitizer.sanitizeFilter>;
  let sanitizeArraySpy: jest.SpiedFunction<typeof inputSanitizer.sanitizeArray>;
  let sanitizeStringSpy: jest.SpiedFunction<typeof inputSanitizer.sanitizeString>;

  beforeEach(() => {
    mockCatalogClient = {
      getEntities: jest.fn(),
      getEntitiesJsonApi: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;

    // Spy on the sanitizer methods
    sanitizeFilterSpy = jest.spyOn(inputSanitizer, 'sanitizeFilter');
    sanitizeArraySpy = jest.spyOn(inputSanitizer, 'sanitizeArray');
    sanitizeStringSpy = jest.spyOn(inputSanitizer, 'sanitizeString');

    // Mock the sanitizer methods to return input unchanged
    sanitizeFilterSpy.mockImplementation((filter) => filter);
    sanitizeArraySpy.mockImplementation((arr, _fieldName, sanitizer) => arr.map(sanitizer!));
    sanitizeStringSpy.mockImplementation((str) => str);
  });

  describe('execute', () => {
    it('should call the catalog client getEntities method with standard format', async () => {
      const request: ToolGetEntitiesRequest = {
        filter: [{ key: 'kind', values: ['Component'] }],
        fields: ['metadata.name', 'spec.type'],
        limit: 10,
        offset: 0,
        format: 'standard' as const,
      };

      const entitiesResult: GetEntitiesResponse = {
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'comp1', namespace: 'default' },
            spec: { type: 'service' },
          },
        ],
      };

      mockCatalogClient.getEntities.mockResolvedValue(entitiesResult);

      const result = await GetEntitiesTool.execute(request, mockContext);

      expect(sanitizeFilterSpy).toHaveBeenCalledWith(request.filter);
      expect(sanitizeArraySpy).toHaveBeenCalledWith(request.fields, 'fields', expect.any(Function));
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith({
        filter: request.filter,
        fields: request.fields,
        limit: request.limit,
        offset: request.offset,
        format: request.format,
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      // FormattedTextResponse returns formatted text, not JSON
      const responseText = result.content[0].text;
      const expectedResponseText = {
        status: 'success',
        data: {
          items: [
            {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'Component',
              metadata: { name: 'comp1', namespace: 'default' },
              spec: { type: 'service' },
            },
          ],
        },
      };

      expect(responseText).toEqual(JSON.stringify(expectedResponseText, null, 2));
    });

    it('should call the catalog client getEntitiesJsonApi method with jsonapi format', async () => {
      const request: ToolGetEntitiesRequest = {
        filter: [{ key: 'kind', values: ['Component'] }],
        limit: 5,
        format: 'jsonapi' as const,
      };

      const jsonApiResult: JsonApiDocument = {
        data: [
          {
            type: 'component',
            id: 'component:default/comp1',
            attributes: {
              name: 'comp1',
              namespace: 'default',
            },
          },
        ],
        meta: { total: 1 },
      };

      mockCatalogClient.getEntitiesJsonApi.mockResolvedValue(jsonApiResult);

      const result = await GetEntitiesTool.execute(request, mockContext);

      expect(mockCatalogClient.getEntitiesJsonApi).toHaveBeenCalledWith({
        filter: request.filter,
        fields: undefined,
        limit: request.limit,
        format: request.format,
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(jsonApiResult);
    });

    it('should handle errors from the catalog client', async () => {
      const request: ToolGetEntitiesRequest = {
        filter: [{ key: 'kind', values: ['InvalidKind'] }],
        format: 'standard' as const,
      };

      const error = new Error('Failed to get entities');
      mockCatalogClient.getEntities.mockRejectedValue(error);

      const result = await GetEntitiesTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Failed to get_entities: Failed to get entities');
    });

    it('should default to json format when format is not specified', async () => {
      const request: ToolGetEntitiesRequest = {
        limit: 10,
        format: 'jsonapi', // Default format
      };

      const jsonApiResult: JsonApiDocument = {
        data: [],
        meta: { total: 0 },
      };

      mockCatalogClient.getEntitiesJsonApi.mockResolvedValue(jsonApiResult);

      const result = await GetEntitiesTool.execute(request, mockContext);

      expect(mockCatalogClient.getEntitiesJsonApi).toHaveBeenCalled();
      expect(mockCatalogClient.getEntities).not.toHaveBeenCalled();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('"status": "success"');
      expect(result.content[0].text).toContain('"data":');
    });
  });
});
