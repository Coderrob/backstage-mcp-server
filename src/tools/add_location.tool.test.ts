import { jest } from '@jest/globals';

import { IBackstageCatalogApi } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { AddLocationTool } from './add_location.tool.js';

describe('AddLocationTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;

  beforeEach(() => {
    mockCatalogClient = {
      addLocation: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  });

  describe('execute', () => {
    it('should call the catalog client addLocation method with correct parameters', async () => {
      const request = {
        type: 'github',
        target: 'https://github.com/example/repo',
      };

      const expectedResponse = { id: 'location-123' } as const;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCatalogClient.addLocation.mockResolvedValue(expectedResponse as any);

      const result = await AddLocationTool.execute(request, mockContext);

      expect(mockCatalogClient.addLocation).toHaveBeenCalledWith(request);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseData = JSON.parse(result.content[0].text as string);
      expect(responseData.status).toBe('success');
      expect(responseData.data).toEqual(expectedResponse);
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        type: 'github',
        target: 'https://github.com/example/repo',
      };

      const error = new Error('Location already exists');
      mockCatalogClient.addLocation.mockRejectedValue(error);

      const result = await AddLocationTool.execute(request, mockContext);

      // ToolErrorHandler should format the error as a JSON:API error response
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Location already exists');
      expect(errorData.data.code).toBe('CONFLICT');
    });
  });
});
