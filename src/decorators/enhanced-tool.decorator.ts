import 'reflect-metadata';

import { z } from 'zod';

import { IToolMetadata, ToolClass } from '../types/tools.js';

const toolMetadataMap = new Map<ToolClass, IToolMetadata>();

export { toolMetadataMap };

export const TOOL_METADATA_KEY = Symbol('TOOL_METADATA');

/**
 * Enhanced tool decorator with automatic schema inference and validation
 */
export function Tool<T extends z.ZodSchema<unknown>>(config: {
  name: string;
  description: string;
  paramsSchema?: T;
  category?: string;
  tags?: string[];
  version?: string;
  deprecated?: boolean;
  cacheable?: boolean;
  requiresConfirmation?: boolean;
  requiredScopes?: string[];
  maxBatchSize?: number;
}): <TTarget extends { new (...args: unknown[]): unknown }>(target: TTarget) => TTarget {
  return function <TTarget extends { new (...args: unknown[]): unknown }>(target: TTarget): TTarget {
    // Store metadata
    const metadata: IToolMetadata = {
      name: config.name,
      description: config.description,
      paramsSchema: config.paramsSchema,
      category: config.category,
      tags: config.tags,
      version: config.version,
      deprecated: config.deprecated,
    };

    toolMetadataMap.set(target as unknown as ToolClass, metadata);

    // Add metadata to class prototype for runtime access
    Reflect.defineMetadata(TOOL_METADATA_KEY, metadata, target.prototype);

    return target;
  };
}

/**
 * Decorator for read-only tools (GET operations)
 */
export function ReadTool<T extends z.ZodSchema<unknown>>(config: {
  name: string;
  description: string;
  paramsSchema?: T;
  cacheable?: boolean;
  tags?: string[];
}): <TTarget extends { new (...args: unknown[]): unknown }>(target: TTarget) => TTarget {
  return Tool({
    ...config,
    category: 'read',
    tags: [...(config.tags || []), 'readonly'],
    cacheable: config.cacheable,
  });
}

/**
 * Decorator for write tools (POST/PUT/PATCH operations)
 */
export function WriteTool<T extends z.ZodSchema<unknown>>(config: {
  name: string;
  description: string;
  paramsSchema?: T;
  requiresConfirmation?: boolean;
  tags?: string[];
}): <TTarget extends { new (...args: unknown[]): unknown }>(target: TTarget) => TTarget {
  return Tool({
    ...config,
    category: 'write',
    tags: [...(config.tags || []), 'write'],
    requiresConfirmation: config.requiresConfirmation,
  });
}

/**
 * Decorator for tools that require authentication
 */
export function AuthenticatedTool<T extends z.ZodSchema<unknown>>(config: {
  name: string;
  description: string;
  paramsSchema?: T;
  requiredScopes?: string[];
  tags?: string[];
}): <TTarget extends { new (...args: unknown[]): unknown }>(target: TTarget) => TTarget {
  return Tool({
    ...config,
    tags: [...(config.tags || []), 'authenticated'],
    requiredScopes: config.requiredScopes,
  });
}

/**
 * Decorator for batch operations
 */
export function BatchTool<T extends z.ZodSchema<unknown>>(config: {
  name: string;
  description: string;
  paramsSchema?: T;
  maxBatchSize?: number;
  tags?: string[];
}): <TTarget extends { new (...args: unknown[]): unknown }>(target: TTarget) => TTarget {
  return Tool({
    ...config,
    category: 'batch',
    tags: [...(config.tags || []), 'batch'],
    maxBatchSize: config.maxBatchSize,
  });
}
