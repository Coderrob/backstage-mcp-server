import { toolMetadataMap } from '../../decorators/tool.decorator';
import { IToolMetadata } from '../../types';
import { ReflectToolMetadataProvider } from './tool-metadata.js';

describe('ReflectToolMetadataProvider', () => {
  let provider: ReflectToolMetadataProvider;

  beforeEach(() => {
    provider = new ReflectToolMetadataProvider();
    toolMetadataMap.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return metadata if present in toolMetadataMap', () => {
    class DummyTool {}
    const metadata: IToolMetadata = { name: 'dummy', description: 'desc' };
    toolMetadataMap.set(DummyTool, metadata);

    const result = provider.getMetadata(DummyTool);

    expect(result).toBe(metadata);
  });

  it('should return undefined if metadata is not present', () => {
    class AnotherTool {}

    const result = provider.getMetadata(AnotherTool);

    expect(result).toBeUndefined();
  });

  it('should work when passing an object instance', () => {
    class InstanceTool {}
    const metadata: IToolMetadata = { name: 'instance', description: 'desc' };
    toolMetadataMap.set(InstanceTool, metadata);

    const instance = new InstanceTool();
    const result = provider.getMetadata(instance);

    expect(result).toBe(metadata);
  });
});
