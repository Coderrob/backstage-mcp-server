import { jest } from '@jest/globals';

import { IBackstageCatalogApi } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { RemoveEntityByUidTool } from './remove_entity_by_uid.tool.js';

describe('RemoveEntityByUidTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      removeEntityByUid: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  });

  describe('execute', () => {
    it('should call the catalog client removeEntityByUid method with correct parameters', async () => {
      const request = {
        uid: '550e8400-e29b-41d4-a716-446655440000',
      };

      mockCatalogClient.removeEntityByUid.mockResolvedValue(undefined);

      const result = await RemoveEntityByUidTool.execute(request, mockContext);

      expect(mockCatalogClient.removeEntityByUid).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        uid: '550e8400-e29b-41d4-a716-446655440000',
      };

      const error = new Error('Entity not found');
      mockCatalogClient.removeEntityByUid.mockRejectedValue(error);

      const result = await RemoveEntityByUidTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Entity not found');
    });
  });
});
