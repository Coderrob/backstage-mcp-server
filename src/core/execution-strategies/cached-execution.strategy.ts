/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { ApiStatus } from '../../shared/types/apis.js';
import { JsonToTextResponse } from '../../shared/utils/responses.js';
import { ITool, IToolExecutionArgs, IToolExecutionContext, IToolExecutionStrategy, IToolMetadata } from '../types.js';
import { StandardExecutionStrategy } from './standard-execution.strategy.js';

/**
 * Cached execution strategy with TTL support
 * Implements caching cross-cutting concern through strategy pattern
 */

export class CachedExecutionStrategy implements IToolExecutionStrategy {
  private cache = new Map<string, { result: CallToolResult; timestamp: number }>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.ttlMs = ttlMs;
  }

  async execute(
    tool: ITool,
    params: IToolExecutionArgs,
    context: IToolExecutionContext,
    metadata: IToolMetadata
  ): Promise<CallToolResult> {
    // Only cache if tool is marked as cacheable
    if (!metadata.cacheable) {
      return new StandardExecutionStrategy().execute(tool, params, context, metadata);
    }

    const cacheKey = this.generateCacheKey(metadata.name, params);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    // Return cached result if valid
    if (cached && now - cached.timestamp < this.ttlMs) {
      return cached.result;
    }

    // Execute and cache result
    try {
      const result = await tool.execute(params, context);
      this.cache.set(cacheKey, { result, timestamp: now });

      // Clean expired entries periodically
      this.cleanExpiredEntries();

      return result;
    } catch (error) {
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'EXECUTION_ERROR',
        },
      });
    }
  }

  private generateCacheKey(toolName: string, params: IToolExecutionArgs): string {
    return `${toolName}:${JSON.stringify(params)}`;
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached entries
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxAge: number } {
    const now = Date.now();
    let maxAge = 0;

    for (const value of this.cache.values()) {
      const age = now - value.timestamp;
      maxAge = Math.max(maxAge, age);
    }

    return {
      size: this.cache.size,
      maxAge,
    };
  }
}
