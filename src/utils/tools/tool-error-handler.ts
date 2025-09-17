import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { IToolRegistrationContext } from '../../types/tools.js';
import { isObject } from '../core/guards.js';
import { logger } from '../core/logger.js';
import { createSimpleError, createStandardError, ErrorType } from '../formatting/responses.js';

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
      return this.handleToolError(error, toolName, operation, args, useJsonApi);
    }
  }

  /**
   * Handles errors that occur during tool execution.
   * @param error - The error that occurred
   * @param toolName - Name of the tool that failed
   * @param operation - Operation being performed
   * @param args - Arguments passed to the tool
   * @param useJsonApi - Whether to use JSON:API error format
   * @returns MCP tool result with error information
   * @private
   */
  private static handleToolError<TArgs>(
    error: unknown,
    toolName: string,
    operation: string,
    args: TArgs,
    useJsonApi: boolean
  ): CallToolResult {
    logger.error(`Tool execution failed: ${toolName}`, {
      operation,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorType = this.classifyError(error);

    if (useJsonApi) {
      return this.createJsonApiErrorResponse(error, errorType, toolName, operation, args);
    }

    return this.createSimpleErrorResponse(error, operation);
  }

  /**
   * Creates a JSON:API formatted error response.
   * @param error - The error that occurred
   * @param errorType - The classified error type
   * @param toolName - Name of the tool that failed
   * @param operation - Operation being performed
   * @param args - Arguments passed to the tool
   * @returns MCP tool result with JSON:API error format
   * @private
   */
  private static createJsonApiErrorResponse<TArgs>(
    error: unknown,
    errorType: ErrorType,
    toolName: string,
    operation: string,
    args: TArgs
  ): CallToolResult {
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
  }

  /**
   * Creates a simple error response for backward compatibility.
   * @param error - The error that occurred
   * @param operation - Operation being performed
   * @returns MCP tool result with simple error format
   * @private
   */
  private static createSimpleErrorResponse(error: unknown, operation: string): CallToolResult {
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

  /**
   * Classifies an error to determine the appropriate error type.
   * Analyzes error messages to categorize errors for proper handling and reporting.
   * @param error - The error object to classify
   * @returns The appropriate ErrorType for the given error
   * @private
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
   * Sanitizes arguments for logging by removing sensitive data.
   * Currently returns arguments as-is, but can be extended to filter sensitive fields.
   * @param args - The arguments to sanitize
   * @returns Sanitized arguments safe for logging
   * @private
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
