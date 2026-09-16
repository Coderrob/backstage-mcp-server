/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpErrorCode, McpHarnessError } from './errors.js';

/**
 * Creates an MCP error result with structured error metadata.
 * @param code - The stable application error code.
 * @param message - The safe user-facing error message.
 * @param details - Optional structured error details.
 * @returns An MCP tool result marked as an error.
 */
export function errorResult(
  code: McpErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>
): CallToolResult {
  const body = { error: { code, message, ...(details ? { details } : {}) } };
  return {
    isError: true,
    content: [{ type: 'text', text: stringify(body) }],
    structuredContent: body,
  };
}

/**
 * Creates an MCP result containing both JSON text and structured content.
 * @param value - The object to serialize.
 * @returns An MCP tool result containing the supplied value.
 */
export function jsonResult<T extends object>(value: Readonly<T>): CallToolResult {
  return {
    content: [{ type: 'text', text: stringify(value) }],
    structuredContent: value as Record<string, unknown>,
  };
}

/**
 * Maps an unknown failure to a safe MCP tool error result.
 * @param error - The failure raised during tool execution.
 * @param requestId - The request identifier used to correlate unexpected failures.
 * @returns A sanitized MCP tool error result.
 */
export function mapToolError(error: unknown, requestId: string): CallToolResult {
  if (error instanceof McpHarnessError) {
    return errorResult(error.code, error.message, error.details);
  }
  return errorResult(McpErrorCode.INTERNAL_ERROR, 'An unexpected error occurred', { requestId });
}

/**
 * Serializes a value as indented JSON while preserving bigint values as strings.
 * @param value - The value to serialize.
 * @returns The serialized JSON text.
 */
function stringify(value: unknown): string {
  return JSON.stringify(
    value,
    /** Serializes bigint values without losing precision. */ (_key, nested) =>
      typeof nested === 'bigint' ? nested.toString() : nested,
    2
  );
}

/**
 * Creates a plain-text MCP tool result.
 * @param text - The text returned to the caller.
 * @returns An MCP tool result containing one text content block.
 */
export function textResult(text: string): CallToolResult {
  return { content: [{ type: 'text', text }] };
}
