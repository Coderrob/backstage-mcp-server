import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IToolExecutionArgs, IToolExecutionContext } from '../../types/tools.js';

/**
 * Middleware interface for tool execution pipeline
 */
export interface IToolMiddleware {
  name: string;
  priority: number;

  /**
   * Execute middleware logic
   * @param args - Tool execution arguments
   * @param context - Execution context
   * @param next - Next middleware in the chain
   * @returns Promise resolving to tool result
   */
  execute(
    args: IToolExecutionArgs,
    context: IToolExecutionContext,
    next: (args: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult>;
}

/**
 * Middleware pipeline for tool execution
 */
export class ToolMiddlewarePipeline {
  private middlewares: IToolMiddleware[] = [];

  /**
   * Add middleware to the pipeline
   */
  use(middleware: IToolMiddleware): void {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute the middleware pipeline
   */
  async execute(
    args: IToolExecutionArgs,
    context: IToolExecutionContext,
    finalHandler: (args: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    let index = 0;

    const next = async (nextArgs: IToolExecutionArgs, nextContext: IToolExecutionContext): Promise<CallToolResult> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        return middleware.execute(nextArgs, nextContext, next);
      }
      return finalHandler(nextArgs, nextContext);
    };

    return next(args, context);
  }
}

/**
 * Authentication middleware
 */
export class AuthenticationMiddleware implements IToolMiddleware {
  name = 'authentication';
  priority = 10;

  async execute(
    args: IToolExecutionArgs,
    context: IToolExecutionContext,
    next: (args: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    // Authentication logic here
    return next(args, context);
  }
}

/**
 * Validation middleware
 */
export class ValidationMiddleware implements IToolMiddleware {
  name = 'validation';
  priority = 20;

  async execute(
    args: IToolExecutionArgs,
    context: IToolExecutionContext,
    next: (args: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    // Validation logic here
    return next(args, context);
  }
}

/**
 * Caching middleware
 */
export class CachingMiddleware implements IToolMiddleware {
  name = 'caching';
  priority = 5; // Run before authentication

  async execute(
    args: IToolExecutionArgs,
    context: IToolExecutionContext,
    next: (args: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    // Caching logic here
    return next(args, context);
  }
}
