/* eslint-disable import/no-unused-modules */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { ApiStatus, IApiResponse } from '../types';
import { isBigInt } from './guards';

type ContentItem = {
  type: 'text';
  text: string;
};

interface IApiErrorResponse extends IApiResponse {
  status: ApiStatus.ERROR;
  data: {
    message: string;
  };
}

interface IApiSuccessResponse<T = unknown> extends IApiResponse {
  status: ApiStatus.SUCCESS;
  data?: T;
}

/**
 * Type guard for error responses
 */
function isErrorResponse(response: IApiResponse): response is IApiErrorResponse {
  return response.status === ApiStatus.ERROR;
}

/**
 * Creates a text response for MCP
 * @param text
 * @returns
 */
export function TextResponse(text: string): CallToolResult {
  return { content: [{ type: 'text', text }] };
}

/**
 * Creates a JSON text response for MCP
 * @param data
 * @returns
 */
export function JsonToTextResponse<T extends IApiResponse>(data: T): CallToolResult {
  return TextResponse(JSON.stringify(data, (_k, v) => (isBigInt(v) ? v.toString() : v), 2));
}

/**
 * Creates a formatted text response optimized for LLMs
 * @param data
 * @param formatter
 * @returns
 */
export function FormattedTextResponse<T extends IApiResponse>(
  data: T,
  formatter?: (data: T) => string
): CallToolResult {
  let text: string;

  if (isErrorResponse(data)) {
    text = `❌ Error: ${data.data?.message || 'Unknown error occurred'}`;
  } else if (formatter) {
    text = formatter(data);
  } else {
    // Default formatter for success responses
    const successData = data as IApiSuccessResponse;
    const hasSuccessData = successData.data !== undefined && successData.data !== null;
    text = `✅ Success${hasSuccessData ? `: ${JSON.stringify(successData.data, null, 2)}` : ''}`;
  }

  return TextResponse(text);
}

/**
 * Creates a multi-content response with both formatted text and JSON
 * @param data
 * @param formatter
 * @returns
 */
export function MultiContentResponse<T extends IApiResponse>(data: T, formatter?: (data: T) => string): CallToolResult {
  const content: ContentItem[] = [];

  // Add formatted text for LLM consumption
  if (isErrorResponse(data)) {
    content.push({
      type: 'text',
      text: `❌ Error: ${data.data?.message || 'Unknown error occurred'}`,
    });
  } else if (formatter) {
    content.push({
      type: 'text',
      text: formatter(data),
    });
  } else {
    const successData = data as IApiSuccessResponse;
    const hasSuccessData = successData.data !== undefined && successData.data !== null;
    content.push({
      type: 'text',
      text: `✅ Success${hasSuccessData ? `: ${JSON.stringify(successData.data, null, 2)}` : ''}`,
    });
  }

  // Add JSON for programmatic access
  content.push({
    type: 'text',
    text: JSON.stringify(data, (_k, v) => (isBigInt(v) ? v.toString() : v), 2),
  });

  return { content };
}

/**
 * Formatter for entity list responses
 */
export function formatEntityList(data: IApiSuccessResponse): string {
  if (data.data === undefined || data.data === null || !Array.isArray(data.data)) {
    return '✅ Success: No entities found';
  }

  const entities = data.data as unknown[];
  const count = entities.length;

  if (count === 0) {
    return '✅ Success: No entities found';
  }

  // Group by kind
  const byKind: Record<string, number> = {};
  entities.forEach((entity) => {
    const entityObj = entity as Record<string, unknown>;
    const kind = String(entityObj.kind ?? 'unknown');
    byKind[kind] = (byKind[kind] || 0) + 1;
  });

  const kindSummary = Object.entries(byKind)
    .map(([kind, count]) => `${kind}: ${count}`)
    .join(', ');

  return `✅ Found ${count} entities (${kindSummary})`;
}

/**
 * Formatter for single entity responses
 */
export function formatEntity(data: IApiSuccessResponse): string {
  if (data.data === undefined || data.data === null) {
    return '✅ Success: Entity not found';
  }

  const entity = data.data as Record<string, unknown>;
  const kind = String(entity.kind ?? 'Unknown');
  const namespace = String(entity.namespace ?? 'default');
  const name = String(entity.name ?? 'unnamed');
  const metadata = (entity.metadata as Record<string, unknown> | undefined) ?? undefined;

  return `✅ Found ${kind} entity: ${namespace}/${name}
📝 Title: ${metadata?.title ?? 'No title'}
📄 Description: ${metadata?.description ?? 'No description'}
🏷️ Tags: ${(metadata?.tags as string[] | undefined)?.join(', ') ?? 'None'}`;
}

/**
 * Formatter for location responses
 */
export function formatLocation(data: IApiSuccessResponse): string {
  if (data.data === undefined || data.data === null) {
    return '✅ Success: Location not found';
  }

  const location = data.data as Record<string, unknown>;
  const id = location.id !== undefined && location.id !== null ? String(location.id) : 'unknown';
  const type = location.type !== undefined && location.type !== null ? String(location.type) : 'unknown';
  const target = location.target !== undefined && location.target !== null ? String(location.target) : 'unknown';
  const tags = Array.isArray(location.tags as unknown) ? (location.tags as string[]) : [];

  return `✅ Location found:
📍 ID: ${id}
🎯 Type: ${type}
🔗 Target: ${target}
🏷️ Tags: ${tags.length > 0 ? tags.join(', ') : 'None'}`;
}
