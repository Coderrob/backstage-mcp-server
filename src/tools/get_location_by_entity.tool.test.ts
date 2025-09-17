import { jest } from '@jest/globals';

import { IBackstageCatalogApi } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { GetLocationByEntityTool } from './get_location_by_entity.tool.js';

describe('GetLocationByEntityTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      getLocationByEntity: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  });

  describe('execute', () => {
    it('should call the catalog client getLocationByEntity method with string entityRef', async () => {
      const request = {
        entityRef: 'component:default/my-component',
      };

      const locationResult = {
        id: 'location-123',
        type: 'github',
        target: 'https://github.com/example/repo',
      };

      mockCatalogClient.getLocationByEntity.mockResolvedValue(locationResult);

      const result = await GetLocationByEntityTool.execute(request, mockContext);

      expect(mockCatalogClient.getLocationByEntity).toHaveBeenCalledWith('component:default/my-component');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(locationResult);
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        entityRef: 'component:default/nonexistent',
      };

      const error = new Error('Entity not found');
      mockCatalogClient.getLocationByEntity.mockRejectedValue(error);

      const result = await GetLocationByEntityTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Entity not found');
    });
  });
});
