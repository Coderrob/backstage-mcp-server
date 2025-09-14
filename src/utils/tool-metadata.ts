import { ToolClass, toolMetadataMap } from '../decorators/tool.decorator';
import { ToolMetadata, ToolMetadataProvider } from '../types';

export class ReflectToolMetadataProvider implements ToolMetadataProvider {
  getMetadata(toolClass: ToolClass | object): ToolMetadata | undefined {
    return toolMetadataMap.get(toolClass as ToolClass);
  }
}
