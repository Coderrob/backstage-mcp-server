/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import type { QueryEntitiesRequest } from '@backstage/catalog-client';
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import type { McpToolPolicy } from '../../mcp/definitions.js';
import { McpErrorCode, McpHarnessError, McpNotFoundError, McpUpstreamError } from '../../mcp/errors.js';
import { jsonResult } from '../../mcp/results.js';

/** Common success envelope emitted by Catalog tools. */
export const successOutputSchema = z.object({ status: z.literal('success'), data: z.unknown().optional() });

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

const orderFieldSchema = z.object({ field: z.string().min(1), order: z.enum(['asc', 'desc']) });

/** Query input shared by the modern and compatibility entity-query tools. */
export const queryEntitiesInputSchema = z.object({
  filter: catalogFilterSchema.optional(),
  fields: fieldsSchema,
  order: z.object({ field: z.string().min(1), order: z.enum(['asc', 'desc']).optional() }).optional(),
  orderFields: z.union([orderFieldSchema, z.array(orderFieldSchema).min(1)]).optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional(),
  fullTextFilter: z
    .object({ term: z.string().trim().min(1), fields: z.array(z.string().min(1)).min(1).optional() })
    .optional(),
  totalItems: z.enum(['include', 'exclude']).optional(),
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
  timeoutMs: 30_000,
  cache: { ttlMs: 120_000, tags: ['catalog'] },
};

/** Standard policy for Catalog mutations. */
export const catalogWritePolicy: McpToolPolicy = {
  timeoutMs: 30_000,
  rateLimit: { maxRequests: 50, windowMs: 60_000 },
  invalidates: ['catalog'],
};

/** Standard policy for uncached Catalog operations. */
export const catalogOperationPolicy: McpToolPolicy = { timeoutMs: 30_000 };

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
    return jsonResult({ status: 'success' as const, data });
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
    return jsonResult({ status: 'success' as const, ...(data === undefined ? {} : { data }) });
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
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return undefined;
  const statusCode = Reflect.get(error, 'statusCode');
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
  const messages: Partial<Record<number, [McpErrorCode, string]>> = {
    401: [McpErrorCode.AUTHENTICATION_REQUIRED, 'Backstage rejected the configured external-access token'],
    403: [McpErrorCode.INSUFFICIENT_PERMISSIONS, 'The Backstage token is not permitted to perform this operation'],
    409: [McpErrorCode.CONFLICT, 'The Backstage Catalog operation conflicts with existing state'],
    429: [McpErrorCode.RATE_LIMITED, 'Backstage rate limited the Catalog operation'],
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
    ? { field: input.order.field, order: input.order.order ?? ('asc' as const) }
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
