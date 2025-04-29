import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { IApiResponse } from '../types';

/**
 *
 * @param text
 * @returns
 */
export function TextResponse(text: string): CallToolResult {
  return { content: [{ type: 'text', text }] };
}

export function JsonToTextResponse<T extends IApiResponse>(
  data: T
): CallToolResult {
  return TextResponse(
    JSON.stringify(data, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))
  );
}
