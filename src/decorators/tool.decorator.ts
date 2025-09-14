import 'reflect-metadata';

import { ToolMetadata } from '../types';

/**
 * Tool class constructor type. We only need to store the constructor as the key
 * in the metadata map.
 */
export type ToolClass = new (...args: unknown[]) => unknown;

const toolMetadataMap = new Map<ToolClass, ToolMetadata>();

export { toolMetadataMap };

export const TOOL_METADATA_KEY = Symbol('TOOL_METADATA');

export function Tool(metadata: ToolMetadata): ClassDecorator {
  return (target) => {
    toolMetadataMap.set(target as unknown as ToolClass, metadata);
  };
}
