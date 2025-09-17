import { jest } from '@jest/globals';

import { IBackstageCatalogApi } from '../types/apis.js';
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
      mockCatalogClient.getLocationByRef.mockResolvedValue(expectedLocation);

      const result = await GetLocationByRefTool.execute(request, mockContext);

      expect(mockCatalogClient.getLocationByRef).toHaveBeenCalledWith('github:https://github.com/example/repo');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseText = result.content[0].text;
      expect(responseText).toContain('Location found:');
      expect(responseText).toContain('ID: location-123');
      expect(responseText).toContain('Type: github');
      expect(responseText).toContain('Target: https://github.com/example/repo');
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
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Location not found');
    });
  });
});
