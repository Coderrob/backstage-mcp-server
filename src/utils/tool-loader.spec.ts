import { ToolLoader } from './tool-loader';
import { join } from 'path';

describe('ToolLoader', () => {
  const validTool = {
    execute: jest.fn(),
  };

  const validMetadata = {
    name: 'demoTool',
    description: 'Demo',
    paramsSchema: { foo: 'bar' },
  };

  const mockFactory = {
    loadTool: jest.fn(),
  };

  const mockRegistrar = {
    register: jest.fn(),
  };

  const mockValidator = {
    validate: jest.fn(),
  };

  const mockMetadataProvider = {
    getMetadata: jest.fn(),
  };

  const loader = new ToolLoader(
    join(__dirname, '__fixtures__'),
    mockFactory,
    mockRegistrar,
    mockValidator,
    mockMetadataProvider
  );

  afterEach(() => jest.clearAllMocks());

  it('should skip invalid tool files', async () => {
    mockFactory.loadTool.mockResolvedValue(undefined);
    await loader.registerAll();
    expect(mockRegistrar.register).not.toHaveBeenCalled();
  });

  it('should skip tools without metadata', async () => {
    mockFactory.loadTool.mockResolvedValue(validTool);
    mockMetadataProvider.getMetadata.mockReturnValue(undefined);
    await loader.registerAll();
    expect(mockRegistrar.register).not.toHaveBeenCalled();
  });

  it('should register valid tools', async () => {
    mockFactory.loadTool.mockResolvedValue(validTool);
    mockMetadataProvider.getMetadata.mockReturnValue(validMetadata);
    await loader.registerAll();
    expect(mockValidator.validate).toHaveBeenCalledWith(
      validMetadata,
      expect.any(String)
    );
    expect(mockRegistrar.register).toHaveBeenCalledWith(
      validTool,
      validMetadata
    );
  });
});
