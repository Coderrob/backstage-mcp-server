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

import type { QueryEntitiesRequest } from '@backstage/catalog-client';
import {
  jsonResult,
  McpErrorCode,
  McpHarnessError,
  McpNotFoundError,
  type McpToolPolicy,
  McpUpstreamError,
} from '@coderrob/mcp-kernel';
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import {
  BACKSTAGE_STATUS_CODE_PROPERTY,
  CATALOG_CACHE_TAG,
  CATALOG_CACHE_TTL_MS,
  CATALOG_OPERATION_TIMEOUT_MS,
  CATALOG_QUERY_LIMIT_MAXIMUM,
  CATALOG_RATE_LIMIT_MAXIMUM,
  CATALOG_RATE_LIMIT_WINDOW_MS,
  CatalogHttpStatus,
  CatalogResultStatus,
  CatalogSortOrder,
  CatalogTotalItemsMode,
} from '../../shared/constants/backstage-catalog.js';

/** Common success envelope emitted by Catalog tools. */
export const successOutputSchema = z.object({
  status: z.literal(CatalogResultStatus.SUCCESS),
  data: z.unknown().optional(),
});

/** String or structured compound entity reference accepted by Catalog tools. */
export const entityRefSchema = z.union([
  z.string().min(1),
  z.object({ kind: z.string().min(1), namespace: z.string().min(1), name: z.string().min(1) }),
]);

const filterValueSchema = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]);

/**
 * Reports whether a Catalog filter contains a condition.
 * @param filter - Parsed Catalog filter record.
 * @returns Whether at least one filter key exists.
 */
function hasFilterEntries(filter: Readonly<Record<string, unknown>>): boolean {
  return Object.keys(filter).length > 0;
}

/** One non-empty key-value Catalog filter set. */
const filterRecordSchema = z
  .record(filterValueSchema)
  .refine(hasFilterEntries, 'Catalog filter records cannot be empty');

/** One AND filter record or multiple OR filter records. */
export const catalogFilterSchema = z.union([filterRecordSchema, z.array(filterRecordSchema).min(1)]);

/** Optional response-field projection. */
export const fieldsSchema = z.array(z.string().min(1)).min(1).optional();

const orderFieldSchema = z.object({ field: z.string().min(1), order: z.nativeEnum(CatalogSortOrder) });

/** Query input shared by the modern and compatibility entity-query tools. */
export const queryEntitiesInputSchema = z.object({
  filter: catalogFilterSchema.optional(),
  fields: fieldsSchema,
  order: z.object({ field: z.string().min(1), order: z.nativeEnum(CatalogSortOrder).optional() }).optional(),
  orderFields: z.union([orderFieldSchema, z.array(orderFieldSchema).min(1)]).optional(),
  limit: z.number().int().positive().max(CATALOG_QUERY_LIMIT_MAXIMUM).optional(),
  offset: z.number().int().nonnegative().optional(),
  fullTextFilter: z
    .object({ term: z.string().trim().min(1), fields: z.array(z.string().min(1)).min(1).optional() })
    .optional(),
  totalItems: z.nativeEnum(CatalogTotalItemsMode).optional(),
  cursor: z.string().min(1).optional(),
});

/** Standard annotations for read-only Catalog operations. */
export const readAnnotations: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

/** Standard annotations for non-destructive Catalog mutations. */
export const writeAnnotations: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

/** Standard annotations for destructive Catalog mutations. */
export const destructiveAnnotations: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: true,
};

/** Standard policy for cacheable Catalog reads. */
export const catalogReadPolicy: McpToolPolicy = {
  timeoutMs: CATALOG_OPERATION_TIMEOUT_MS,
  cache: { ttlMs: CATALOG_CACHE_TTL_MS, tags: [CATALOG_CACHE_TAG] },
};

/** Standard policy for Catalog mutations. */
export const catalogWritePolicy: McpToolPolicy = {
  timeoutMs: CATALOG_OPERATION_TIMEOUT_MS,
  rateLimit: { maxRequests: CATALOG_RATE_LIMIT_MAXIMUM, windowMs: CATALOG_RATE_LIMIT_WINDOW_MS },
  invalidates: [CATALOG_CACHE_TAG],
};

/** Standard policy for uncached Catalog operations. */
export const catalogOperationPolicy: McpToolPolicy = { timeoutMs: CATALOG_OPERATION_TIMEOUT_MS };

/**
 * Executes an optional Catalog lookup and converts absence to NOT_FOUND.
 * @param operation - Pending optional Catalog client operation.
 * @param kind - Safe resource label.
 * @param reference - Requested resource reference.
 * @param fallbackMessage - Safe message for an upstream failure.
 * @returns Structured MCP success result.
 * @throws {McpNotFoundError} When the requested Catalog resource is absent.
 * @throws {McpHarnessError} When Backstage rejects or cannot complete the request.
 */
export async function catalogOptionalResult<T>(
  operation: Readonly<Promise<T | undefined>>,
  kind: string,
  reference: string,
  fallbackMessage: string
): Promise<CallToolResult> {
  try {
    const data = await operation;
    if (data === undefined) throw new McpNotFoundError(kind, reference);
    return jsonResult({ status: CatalogResultStatus.SUCCESS, data });
  } catch (error) {
    if (error instanceof McpNotFoundError) throw error;
    throw toCatalogMcpError(error, fallbackMessage);
  }
}

/**
 * Executes a Catalog operation and returns the common MCP success envelope.
 * @param operation - Pending official Catalog client operation.
 * @param fallbackMessage - Safe message for an unclassified upstream failure.
 * @returns Structured MCP success result.
 * @throws {McpHarnessError} When Backstage rejects or cannot complete the request.
 */
export async function catalogResult<T>(
  operation: Readonly<Promise<T>>,
  fallbackMessage: string
): Promise<CallToolResult> {
  try {
    const data = await operation;
    return jsonResult({ status: CatalogResultStatus.SUCCESS, data });
  } catch (error) {
    throw toCatalogMcpError(error, fallbackMessage);
  }
}

/**
 * Reads the status exposed by Backstage ResponseError.
 * @param error - Unknown official-client error.
 * @returns Numeric HTTP status when available.
 */
function getUpstreamStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !(BACKSTAGE_STATUS_CODE_PROPERTY in error)) return undefined;
  const statusCode = Reflect.get(error, BACKSTAGE_STATUS_CODE_PROPERTY);
  return typeof statusCode === 'number' ? statusCode : undefined;
}

/**
 * Converts official Catalog response failures into stable MCP errors.
 * @param error - Error raised by the official Catalog client.
 * @param fallbackMessage - Safe message used for other upstream failures.
 * @returns Structured MCP error preserving the original cause.
 */
export function toCatalogMcpError(error: unknown, fallbackMessage: string): McpHarnessError {
  const statusCode = getUpstreamStatus(error);
  const options = { cause: error };
  const messages: Readonly<Partial<Record<number, readonly [McpErrorCode, string]>>> = {
    [CatalogHttpStatus.UNAUTHORIZED]: [
      McpErrorCode.AUTHENTICATION_REQUIRED,
      'Backstage rejected the configured external-access token',
    ],
    [CatalogHttpStatus.FORBIDDEN]: [
      McpErrorCode.INSUFFICIENT_PERMISSIONS,
      'The Backstage token is not permitted to perform this operation',
    ],
    [CatalogHttpStatus.CONFLICT]: [
      McpErrorCode.CONFLICT,
      'The Backstage Catalog operation conflicts with existing state',
    ],
    [CatalogHttpStatus.TOO_MANY_REQUESTS]: [McpErrorCode.RATE_LIMITED, 'Backstage rate limited the Catalog operation'],
  };
  const mapped = statusCode === undefined ? undefined : messages[statusCode];
  return mapped === undefined
    ? new McpUpstreamError(fallbackMessage, options)
    : new McpHarnessError(mapped[0], mapped[1], { statusCode }, options);
}

/**
 * Converts a typed compound reference to Backstage string form.
 * @param value - String or structured entity reference.
 * @returns Canonical entity-reference string.
 */
export function toEntityRef(value: Readonly<z.infer<typeof entityRefSchema>>): string {
  return typeof value === 'string' ? value : `${value.kind}:${value.namespace}/${value.name}`;
}

/**
 * Converts validated tool input to an official Backstage entity query.
 * @param input - Validated entity-query input.
 * @returns Query request respecting Backstage cursor continuation semantics.
 */
export function toQueryEntitiesRequest(
  input: Readonly<z.infer<typeof queryEntitiesInputSchema>>
): QueryEntitiesRequest {
  if (input.cursor) return { cursor: input.cursor, fields: input.fields, limit: input.limit };
  const legacyOrder = input.order
    ? { field: input.order.field, order: input.order.order ?? CatalogSortOrder.ASCENDING }
    : undefined;
  return {
    fields: input.fields,
    limit: input.limit,
    offset: input.offset,
    filter: input.filter,
    orderFields: input.orderFields ?? legacyOrder,
    fullTextFilter: input.fullTextFilter,
    totalItems: input.totalItems,
  };
}
