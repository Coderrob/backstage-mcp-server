import { toolMetadataMap } from '../../decorators/tool.decorator.js';
import { IToolMetadata, IToolMetadataProvider, ToolClass } from '../../types/tools.js';
import { isFunction, isObject } from '../core/guards.js';

/**
 * Metadata provider that uses reflection to retrieve tool metadata.
 * Looks up metadata from the tool decorator registry.
 */
export class ReflectToolMetadataProvider implements IToolMetadataProvider {
  /**
   * Retrieves metadata for a tool class or instance.
   * Accepts either a constructor function or an instance object.
   * @param toolClass - The tool class constructor or instance to get metadata for
   * @returns The tool metadata if found, undefined otherwise
   */
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
