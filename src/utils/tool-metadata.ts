import { toolMetadataMap } from '../decorators/tool.decorator';
import { IToolMetadata, IToolMetadataProvider, ToolClass } from '../types';

export class ReflectToolMetadataProvider implements IToolMetadataProvider {
  getMetadata(toolClass: ToolClass | object): IToolMetadata | undefined {
    // Allow callers to pass either a class (constructor) or an instance.
    const key =
      typeof toolClass === 'function'
        ? toolClass
        : toolClass != null && typeof toolClass === 'object'
          ? (toolClass as { constructor: unknown }).constructor
          : toolClass;
    return toolMetadataMap.get(key as ToolClass);
  }
}
