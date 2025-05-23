import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { IApiResponse } from '../types';
import { isBigInt } from './guards';

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
    JSON.stringify(data, (_k, v) => (isBigInt(v) ? v.toString() : v), 2)
  );
}
