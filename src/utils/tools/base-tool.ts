import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { ITool, IToolExecutionArgs, IToolExecutionContext, IToolMetadata } from '../../types/tools.js';

/**
 * Generic base class for all tools with type-safe execution
 */
export abstract class BaseTool<TParams = Record<string, unknown>, TResult = unknown> implements ITool {
  protected abstract readonly metadata: IToolMetadata;
  protected abstract readonly paramsSchema: z.ZodSchema<TParams>;

  /**
   * Type-safe execution method that tools must implement
   */
  abstract executeTyped(params: TParams, context: IToolExecutionContext): Promise<TResult>;

  /**
   * Standard ITool interface implementation with validation
   */
  async execute(args: IToolExecutionArgs, context: IToolExecutionContext): Promise<CallToolResult> {
    const validatedParams = this.paramsSchema.parse(args);
    const result = await this.executeTyped(validatedParams, context);
    return this.formatResult(result);
  }

  /**
   * Hook for formatting execution results
   */
  protected abstract formatResult(result: TResult): CallToolResult;

  /**
   * Get tool metadata
   */
  getMetadata(): IToolMetadata {
    return this.metadata;
  }
}
