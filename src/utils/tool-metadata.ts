import { TOOL_METADATA_KEY } from '../decorators/tool.decorator';
import { ToolMetadata, ToolMetadataProvider } from '../types';

export class ReflectToolMetadataProvider implements ToolMetadataProvider {
  getMetadata(toolClass: object): ToolMetadata | undefined {
    return Reflect.getMetadata(TOOL_METADATA_KEY, toolClass);
  }
}
