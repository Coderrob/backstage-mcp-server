import { jest } from '@jest/globals';

import { IBackstageCatalogApi } from '../types/apis.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { GetEntityByRefTool } from './get_entity_by_ref.tool.js';

// Mock the inputSanitizer
jest.mock('../auth/input-sanitizer.js', () => ({
  inputSanitizer: {
    sanitizeEntityRef: jest.fn(),
  },
}));

import { inputSanitizer } from '../auth/input-sanitizer.js';

describe('GetEntityByRefTool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockCatalogClient: jest.Mocked<IBackstageCatalogApi>;
  let mockContext: IToolRegistrationContext;
  let sanitizeEntityRefSpy: jest.SpiedFunction<typeof inputSanitizer.sanitizeEntityRef>;

  beforeEach(() => {
    mockCatalogClient = {
      getEntityByRef: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;

    mockContext = {
      catalogClient: mockCatalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;

    // Spy on the sanitizeEntityRef method
    sanitizeEntityRefSpy = jest.spyOn(inputSanitizer, 'sanitizeEntityRef');
    sanitizeEntityRefSpy.mockImplementation((ref: string | { kind: string; namespace: string; name: string }) => ref);
  });

  describe('execute', () => {
    it('should call the catalog client getEntityByRef method with string entityRef', async () => {
      const request = {
        entityRef: 'component:default/my-component',
      };

      const expectedEntity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component', namespace: 'default' },
        spec: { type: 'service' },
      };
      mockCatalogClient.getEntityByRef.mockResolvedValue(expectedEntity);

      const result = await GetEntityByRefTool.execute(request, mockContext);

      expect(inputSanitizer.sanitizeEntityRef).toHaveBeenCalledWith('component:default/my-component');
      expect(mockCatalogClient.getEntityByRef).toHaveBeenCalledWith('component:default/my-component');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseText = result.content[0].text;
      expect(responseText).toContain('"status": "success"');
      expect(responseText).toContain('"kind": "Component"');
      expect(responseText).toContain('"name": "my-component"');
      expect(responseText).toContain('"namespace": "default"');
    });

    it('should call the catalog client getEntityByRef method with compound entityRef', async () => {
      const request = {
        entityRef: {
          kind: 'Component',
          namespace: 'default',
          name: 'my-component',
        },
      };

      const expectedEntity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component', namespace: 'default' },
        spec: { type: 'service' },
      };
      mockCatalogClient.getEntityByRef.mockResolvedValue(expectedEntity);

      const result = await GetEntityByRefTool.execute(request, mockContext);

      expect(inputSanitizer.sanitizeEntityRef).toHaveBeenCalledWith({
        kind: 'Component',
        namespace: 'default',
        name: 'my-component',
      });
      expect(mockCatalogClient.getEntityByRef).toHaveBeenCalledWith({
        kind: 'Component',
        namespace: 'default',
        name: 'my-component',
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const responseText = result.content[0].text;
      expect(responseText).toContain('"status": "success"');
      expect(responseText).toContain('"kind": "Component"');
      expect(responseText).toContain('"name": "my-component"');
      expect(responseText).toContain('"namespace": "default"');
    });

    it('should handle errors from the catalog client', async () => {
      const request = {
        entityRef: 'component:default/nonexistent',
      };

      const error = new Error('Entity not found');
      mockCatalogClient.getEntityByRef.mockRejectedValue(error);

      const result = await GetEntityByRefTool.execute(request, mockContext);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const errorData = JSON.parse(result.content[0].text as string);
      expect(errorData.status).toBe('error');
      expect(errorData.data.message).toBe('Entity not found');
    });
  });
});
