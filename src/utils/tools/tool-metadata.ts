import { toolMetadataMap } from '../../decorators/tool.decorator';
import { IToolMetadata, IToolMetadataProvider, ToolClass } from '../../types';
import { isFunction, isObject } from '../../utils';

export class ReflectToolMetadataProvider implements IToolMetadataProvider {
  getMetadata(toolClass: ToolClass | object): IToolMetadata | undefined {
    // Allow callers to pass either a class (constructor) or an instance.
    const key = isFunction(toolClass)
      ? toolClass
      : toolClass != null && isObject(toolClass)
        ? (toolClass as { constructor: unknown }).constructor
        : toolClass;
    return toolMetadataMap.get(key as ToolClass);
  }
}
