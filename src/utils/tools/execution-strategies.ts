import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { ITool, IToolExecutionArgs, IToolExecutionContext, IToolMetadata } from '../../types/tools.js';

/**
 * Strategy pattern for different tool execution contexts
 */
export interface IToolExecutionStrategy {
  execute(
    tool: ITool,
    args: IToolExecutionArgs,
    context: IToolExecutionContext,
    metadata: IToolMetadata
  ): Promise<CallToolResult>;
}

/**
 * Standard execution strategy - direct tool execution
 */
export class StandardExecutionStrategy implements IToolExecutionStrategy {
  async execute(
    tool: ITool,
    args: IToolExecutionArgs,
    context: IToolExecutionContext,
    _metadata: IToolMetadata
  ): Promise<CallToolResult> {
    return tool.execute(args, context);
  }
}

/**
 * Cached execution strategy with TTL support
 */
export class CachedExecutionStrategy implements IToolExecutionStrategy {
  private cache = new Map<string, { result: CallToolResult; timestamp: number }>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.ttlMs = ttlMs;
  }

  async execute(
    tool: ITool,
    args: IToolExecutionArgs,
    context: IToolExecutionContext,
    metadata: IToolMetadata
  ): Promise<CallToolResult> {
    // Only cache if tool is marked as cacheable
    if (!metadata.cacheable) {
      return tool.execute(args, context);
    }

    const cacheKey = this.generateCacheKey(metadata.name, args);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttlMs) {
      return cached.result;
    }

    // Execute and cache
    const result = await tool.execute(args, context);
    this.cache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  }

  private generateCacheKey(toolName: string, args: IToolExecutionArgs): string {
    return `${toolName}:${JSON.stringify(args)}`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Batched execution strategy for handling multiple requests
 */
export class BatchedExecutionStrategy implements IToolExecutionStrategy {
  private batchQueue = new Map<
    string,
    Array<{
      args: IToolExecutionArgs;
      context: IToolExecutionContext;
      resolve: (result: CallToolResult) => void;
      reject: (error: Error) => void;
    }>
  >();

  async execute(
    tool: ITool,
    args: IToolExecutionArgs,
    context: IToolExecutionContext,
    metadata: IToolMetadata
  ): Promise<CallToolResult> {
    // If not a batch operation, execute normally
    if (!metadata.maxBatchSize || metadata.maxBatchSize <= 1) {
      return tool.execute(args, context);
    }

    return new Promise((resolve, reject) => {
      const batchKey = metadata.name;
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, []);
        // Process batch asynchronously
        Promise.resolve().then(() => this.processBatch(batchKey, tool, metadata));
      }

      const queue = this.batchQueue.get(batchKey)!;
      queue.push({ args, context, resolve, reject });

      // If batch is full, process immediately
      if (queue.length >= (metadata.maxBatchSize || 1)) {
        this.processBatch(batchKey, tool, metadata);
      }
    });
  }

  private async processBatch(batchKey: string, tool: ITool, _metadata: IToolMetadata): Promise<void> {
    const queue = this.batchQueue.get(batchKey);
    if (!queue || queue.length === 0) return;

    this.batchQueue.delete(batchKey);

    try {
      // For now, execute each request individually
      // In a real implementation, you might batch at the API level
      const results = await Promise.allSettled(queue.map(({ args, context }) => tool.execute(args, context)));

      // Resolve/reject individual promises
      results.forEach((result, index) => {
        const { resolve, reject } = queue[index];
        if (result.status === 'fulfilled') {
          resolve(result.value);
        } else {
          reject(result.reason);
        }
      });
    } catch (error) {
      // If batch processing fails, reject all
      queue.forEach(({ reject }) => reject(error as Error));
    }
  }
}
