import { jest } from '@jest/globals';

import { IBackstageCatalogApi } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { RemoveLocationByIdTool } from './remove_location_by_id.tool.js';

describe('RemoveLocationByIdTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: jest.Mocked<IToolRegistrationContext>;

  beforeEach(() => {
    mockCatalogClient = {
      removeLocationById: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  });

  describe('execute', () => {
    it('should call the catalog client removeLocationById method with correct parameters', async () => {
      const request = {
        locationId: 'location-123',
      };

      mockCatalogClient.removeLocationById.mockResolvedValue(undefined);

      const result = await RemoveLocationByIdTool.execute(request, mockContext);

      expect(mockCatalogClient.removeLocationById).toHaveBeenCalledWith('location-123');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        locationId: 'invalid-location',
      };

      const error = new Error('Location not found');
      mockCatalogClient.removeLocationById.mockRejectedValue(error);

      const result = await RemoveLocationByIdTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Location not found');
    });
  });
});
