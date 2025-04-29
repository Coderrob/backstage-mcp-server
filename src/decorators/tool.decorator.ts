import 'reflect-metadata';
import { ToolMetadata } from '../types';

export const TOOL_METADATA_KEY = Symbol('TOOL_METADATA');

export function Tool(metadata: ToolMetadata): ClassDecorator {
  return (target) =>
    Reflect.defineMetadata(TOOL_METADATA_KEY, metadata, target);
}
