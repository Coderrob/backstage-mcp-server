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

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { McpContentType } from '../shared/constants/mcp-protocol.js';
import { McpErrorCode, McpHarnessError } from './errors.js';

const JSON_INDENT_SPACES = 2;

/**
 * Creates an MCP error result with structured error metadata.
 * @param code - The stable application error code.
 * @param message - The safe user-facing error message.
 * @param details - Optional structured error details.
 * @returns An MCP tool result marked as an error.
 */
export function errorResult(
  code: Readonly<McpErrorCode>,
  message: string,
  details?: Readonly<Record<string, unknown>>
): CallToolResult {
  const body = { error: { code, message, ...(details ? { details } : {}) } };
  return {
    isError: true,
    content: [{ type: McpContentType.TEXT, text: stringify(body) }],
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
    content: [{ type: McpContentType.TEXT, text: stringify(value) }],
    structuredContent: value,
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
    /** Serializes bigint values without losing precision. */ (_key: string, nested: unknown): unknown =>
      typeof nested === 'bigint' ? nested.toString() : nested,
    JSON_INDENT_SPACES
  );
}

/**
 * Creates a plain-text MCP tool result.
 * @param text - The text returned to the caller.
 * @returns An MCP tool result containing one text content block.
 */
export function textResult(text: string): CallToolResult {
  return { content: [{ type: McpContentType.TEXT, text }] };
}
