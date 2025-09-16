/* eslint-disable import/no-unused-modules */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { isObject } from 'util';

import { IToolRegistrationContext } from '../../types/index.js';
import { logger } from '../core/logger.js';
import { createSimpleError, createStandardError, ErrorType } from '../formatting/index.js';

/**
 * Tool execution wrapper that provides standardized error handling
 */
export class ToolErrorHandler {
  /**
   * Executes a tool function with standardized error handling
   * @param toolName - Name of the tool for error reporting
   * @param operation - Operation being performed
   * @param toolFn - The tool function to execute
   * @param useJsonApi - Whether to use JSON:API error format (default: false for backward compatibility)
   * @returns MCP tool result
   */
  static async executeTool<TArgs = unknown>(
    toolName: string,
    operation: string,
    toolFn: (args: TArgs, context: IToolRegistrationContext) => Promise<CallToolResult>,
    args: TArgs,
    context: IToolRegistrationContext,
    useJsonApi: boolean = false
  ): Promise<CallToolResult> {
    try {
      logger.debug(`Executing tool: ${toolName}`, { operation, args });
      const result = await toolFn(args, context);
      logger.debug(`Tool execution successful: ${toolName}`, { operation });
      return result;
    } catch (error) {
      logger.error(`Tool execution failed: ${toolName}`, {
        operation,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Determine error type based on error characteristics
      const errorType = this.classifyError(error);

      if (useJsonApi) {
        const errorResponse = createStandardError(error, errorType, toolName, operation, {
          args: this.sanitizeArgs(args),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
        };
      } else {
        // Backward compatibility - simple error format
        const errorResponse = createSimpleError(
          `Failed to ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
        };
      }
    }
  }

  /**
   * Classifies an error to determine the appropriate error type
   */
  private static classifyError(error: unknown): ErrorType {
    if (!(error instanceof Error)) {
      return ErrorType.UNKNOWN;
    }

    const message = error.message.toLowerCase();

    // Check for specific error patterns
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorType.AUTHENTICATION;
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }

    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }

    if (message.includes('conflict') || message.includes('already exists')) {
      return ErrorType.CONFLICT;
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return ErrorType.RATE_LIMIT;
    }

    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return ErrorType.NETWORK;
    }

    if (message.includes('backstage') || message.includes('api')) {
      return ErrorType.BACKSTAGE_API;
    }

    // Default to internal error for unexpected errors
    return ErrorType.INTERNAL;
  }

  /**
   * Sanitizes arguments for logging (removes sensitive data)
   */
  private static sanitizeArgs(args: unknown): unknown {
    if (!isObject(args)) {
      return args;
    }

    // For now, just return the args as-is. In a production system,
    // you might want to filter out sensitive fields like passwords, tokens, etc.
    return args;
  }
}
