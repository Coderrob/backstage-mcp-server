import { jest } from '@jest/globals';

import { IBackstageCatalogApi } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { RefreshEntityTool } from './refresh_entity.tool.js';

describe('RefreshEntityTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      refreshEntity: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  });

  describe('execute', () => {
    it('should call the catalog client refreshEntity method with correct parameters', async () => {
      const request = {
        entityRef: 'component:default/my-component',
      };

      mockCatalogClient.refreshEntity.mockResolvedValue(undefined);

      const result = await RefreshEntityTool.execute(request, mockContext);

      expect(mockCatalogClient.refreshEntity).toHaveBeenCalledWith('component:default/my-component');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        entityRef: 'component:default/nonexistent',
      };

      const error = new Error('Entity not found');
      mockCatalogClient.refreshEntity.mockRejectedValue(error);

      const result = await RefreshEntityTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Entity not found');
    });
  });
});
