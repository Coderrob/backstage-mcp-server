/* eslint-disable import/no-unused-modules */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { ApiStatus, IApiResponse, ResponseMessage } from '../../types';
import { isBigInt } from '../core';

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

// Enhanced error response with JSON:API metadata
export interface IApiErrorResponseExtended extends IApiResponse {
  status: ApiStatus.ERROR;
  data: {
    message: string;
    code?: string;
    details?: string;
    source?: {
      tool?: string;
      operation?: string;
      parameter?: string;
    };
    jsonapi?: {
      errors?: Array<{
        id?: string;
        status?: string;
        code?: string;
        title?: string;
        detail?: string;
        source?: {
          pointer?: string;
          parameter?: string;
        };
        meta?: Record<string, unknown>;
      }>;
    };
  };
}

/**
 * Error classification for consistent error handling
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK_ERROR',
  BACKSTAGE_API = 'BACKSTAGE_API_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
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
    text = `${ResponseMessage.ERROR_PREFIX}: ${data.data?.message || ResponseMessage.UNKNOWN_ERROR}`;
  } else if (formatter) {
    text = formatter(data);
  } else {
    // Default formatter for success responses
    const successData = data as IApiSuccessResponse;
    const hasSuccessData = successData.data !== undefined && successData.data !== null;
    text = `${ResponseMessage.SUCCESS_PREFIX}${hasSuccessData ? `: ${JSON.stringify(successData.data, null, 2)}` : ''}`;
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
      text: `${ResponseMessage.SUCCESS_PREFIX}${hasSuccessData ? `: ${JSON.stringify(successData.data, null, 2)}` : ''}`,
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
    return `${ResponseMessage.SUCCESS_PREFIX}: ${ResponseMessage.NO_ENTITIES_FOUND}`;
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
    return `${ResponseMessage.SUCCESS_PREFIX}: ${ResponseMessage.ENTITY_NOT_FOUND}`;
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
    return `${ResponseMessage.SUCCESS_PREFIX}: ${ResponseMessage.LOCATION_NOT_FOUND}`;
  }

  const location = data.data as Record<string, unknown>;
  const id = location.id !== undefined && location.id !== null ? String(location.id) : 'unknown';
  const type = location.type !== undefined && location.type !== null ? String(location.type) : 'unknown';
  const target = location.target !== undefined && location.target !== null ? String(location.target) : 'unknown';
  const tags = Array.isArray(location.tags as unknown) ? (location.tags as string[]) : [];

  return `Location found:
  ID: ${id}
  Type: ${type}
  Target: ${target}
  Tags: ${tags.length > 0 ? tags.join(', ') : 'None'}`;
}

/**
 * Creates a standardized error response with JSON:API metadata
 * @param error - The error that occurred
 * @param errorType - Classification of the error
 * @param toolName - Name of the tool where the error occurred
 * @param operation - Operation being performed when error occurred
 * @param additionalDetails - Additional context about the error
 * @returns Standardized error response
 */
export function createStandardError(
  error: unknown,
  errorType: ErrorType,
  toolName: string,
  operation: string,
  additionalDetails?: Record<string, unknown>
): IApiErrorResponseExtended {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = getErrorCode(errorType);

  const response: IApiErrorResponseExtended = {
    status: ApiStatus.ERROR,
    data: {
      message: errorMessage,
      code: errorCode,
      source: {
        tool: toolName,
        operation,
      },
      jsonapi: {
        errors: [
          {
            status: getHttpStatusCode(errorType),
            code: errorCode,
            title: getErrorTitle(errorType),
            detail: errorMessage,
            source: {
              parameter: operation,
            },
            meta: {
              tool: toolName,
              timestamp: new Date().toISOString(),
              ...additionalDetails,
            },
          },
        ],
      },
    },
  };

  return response;
}

/**
 * Creates a simple error response for backward compatibility
 * @param message - Error message
 * @returns Simple error response
 */
export function createSimpleError(message: string): IApiErrorResponse {
  return {
    status: ApiStatus.ERROR,
    data: {
      message,
    },
  };
}

/**
 * Maps error types to HTTP status codes
 */
function getHttpStatusCode(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.VALIDATION:
      return '400';
    case ErrorType.AUTHENTICATION:
      return '401';
    case ErrorType.AUTHORIZATION:
      return '403';
    case ErrorType.NOT_FOUND:
      return '404';
    case ErrorType.CONFLICT:
      return '409';
    case ErrorType.RATE_LIMIT:
      return '429';
    case ErrorType.NETWORK:
    case ErrorType.BACKSTAGE_API:
      return '502';
    case ErrorType.INTERNAL:
    case ErrorType.UNKNOWN:
    default:
      return '500';
  }
}

/**
 * Maps error types to error codes
 */
function getErrorCode(errorType: ErrorType): string {
  return errorType;
}

/**
 * Maps error types to human-readable titles
 */
function getErrorTitle(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.VALIDATION:
      return 'Validation Error';
    case ErrorType.AUTHENTICATION:
      return 'Authentication Failed';
    case ErrorType.AUTHORIZATION:
      return 'Access Denied';
    case ErrorType.NOT_FOUND:
      return 'Resource Not Found';
    case ErrorType.CONFLICT:
      return 'Resource Conflict';
    case ErrorType.RATE_LIMIT:
      return 'Rate Limit Exceeded';
    case ErrorType.NETWORK:
      return 'Network Error';
    case ErrorType.BACKSTAGE_API:
      return 'Backstage API Error';
    case ErrorType.INTERNAL:
      return 'Internal Server Error';
    case ErrorType.UNKNOWN:
    default:
      return 'Unknown Error';
  }
}
