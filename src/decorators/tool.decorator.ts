import 'reflect-metadata';

import { IToolMetadata, ToolClass } from '../types/index.js';

const toolMetadataMap = new Map<ToolClass, IToolMetadata>();

export { toolMetadataMap };

export const TOOL_METADATA_KEY = Symbol('TOOL_METADATA');

export function Tool(metadata: IToolMetadata): ClassDecorator {
  return (target) => {
    toolMetadataMap.set(target as unknown as ToolClass, metadata);
  };
}
