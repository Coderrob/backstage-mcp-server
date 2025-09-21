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
 * Batch execution strategy for handling multiple operations
 * Implements batching optimization through strategy pattern
 */

export class BatchExecutionStrategy implements IToolExecutionStrategy {
  private readonly maxBatchSize: number;

  constructor(maxBatchSize: number = 10) {
    this.maxBatchSize = maxBatchSize;
  }

  async execute(
    tool: ITool,
    params: IToolExecutionArgs,
    context: IToolExecutionContext,
    metadata: IToolMetadata
  ): Promise<CallToolResult> {
    // Check if this is a batch operation
    const batchParams = params as { batch?: unknown[] };
    const batchItems = batchParams.batch;

    if (!Array.isArray(batchItems)) {
      // Not a batch operation, use standard execution
      return new StandardExecutionStrategy().execute(tool, params, context, metadata);
    }

    // Validate batch size
    const maxSize = metadata.maxBatchSize || this.maxBatchSize;
    if (batchItems.length > maxSize) {
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Batch size ${batchItems.length} exceeds maximum allowed size of ${maxSize}`,
          code: 'BATCH_SIZE_EXCEEDED',
        },
      });
    }

    try {
      // Execute batch operations concurrently
      const results = await Promise.allSettled(
        batchItems.map((item) => tool.execute(item as IToolExecutionArgs, context))
      );

      const processedResults = results.map((result, index) => ({
        index,
        status: result.status,
        ...(result.status === 'fulfilled'
          ? { data: result.value }
          : { error: result.reason instanceof Error ? result.reason.message : 'Unknown error' }),
      }));

      return JsonToTextResponse({
        status: ApiStatus.SUCCESS,
        data: {
          results: processedResults,
          total: batchItems.length,
          successful: processedResults.filter((r) => r.status === 'fulfilled').length,
          failed: processedResults.filter((r) => r.status === 'rejected').length,
        },
      });
    } catch (error) {
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: error instanceof Error ? error.message : 'Batch execution failed',
          code: 'BATCH_EXECUTION_ERROR',
        },
      });
    }
  }
}
