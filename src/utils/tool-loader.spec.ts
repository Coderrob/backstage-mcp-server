import { IToolRegistrar, IToolValidator } from '../types';
import { RawToolMetadata } from '../types/tool-metadata';
import { ToolLoader } from './tool-loader';

describe('ToolLoader', () => {
  const validTool = {
    execute: jest.fn(),
  };

  const validMetadata: RawToolMetadata = {
    name: 'demoTool',
    description: 'Demo',
    paramsSchema: { foo: 'bar' },
  };

  const mockFactory = {
    loadTool: jest.fn(),
  };

  const mockRegistrar: IToolRegistrar = {
    register: jest.fn(),
  };

  const mockValidator: IToolValidator = {
    validate: jest.fn(),
  };

  const mockMetadataProvider = {
    getMetadata: jest.fn(),
  };

  class TestToolLoader extends ToolLoader {
    protected async findToolFiles(): Promise<string[]> {
      return ['test.tool.js'];
    }
  }

  const loader = new TestToolLoader('', mockFactory, mockRegistrar, mockValidator, mockMetadataProvider);

  beforeEach(() => {});

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
    expect(mockValidator.validate).toHaveBeenCalledWith(validMetadata, expect.any(String));
    expect(mockRegistrar.register).toHaveBeenCalledWith(validTool, validMetadata);
  });
});
