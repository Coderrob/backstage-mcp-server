/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import type { QueryEntitiesRequest } from '@backstage/catalog-client';
import { z } from 'zod';

import { definePlugin, defineTool } from '../mcp/definitions.js';
import { McpErrorCode, McpHarnessError, McpNotFoundError, McpUpstreamError } from '../mcp/errors.js';
import { jsonResult } from '../mcp/results.js';
import type { IBackstageCatalogApi } from '../types/index.js';

/** Backstage dependencies available to catalog tool handlers. */
export interface BackstageMcpContext {
  catalogClient: IBackstageCatalogApi;
}

const filterValueSchema = z.union([z.string(), z.array(z.string())]);

const fieldsSchema = z.array(z.string().min(1)).optional();
const limitSchema = z.number().int().positive().max(1000).optional();
const orderFieldSchema = z.object({ field: z.string().min(1), order: z.enum(['asc', 'desc']) });

export const getEntitiesInputSchema = z.object({
  filter: z.union([z.record(filterValueSchema), z.array(z.record(filterValueSchema))]).optional(),
  fields: fieldsSchema,
  orderFields: z.union([orderFieldSchema, z.array(orderFieldSchema)]).optional(),
  limit: limitSchema,
  offset: z.number().int().nonnegative().optional(),
  fullTextFilter: z
    .object({
      term: z.string().trim().min(1),
      fields: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  totalItems: z.enum(['include', 'exclude']).optional(),
  cursor: z.string().min(1).optional(),
});

type GetEntitiesInput = z.infer<typeof getEntitiesInputSchema>;

/**
 * Reads the HTTP status exposed by Backstage's ResponseError without coupling
 * the MCP plugin to a particular error package implementation.
 * @param error - Unknown error raised by the official Catalog client.
 * @returns The upstream HTTP status when one is available.
 */
function getUpstreamStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return undefined;
  const statusCode = Reflect.get(error, 'statusCode');
  return typeof statusCode === 'number' ? statusCode : undefined;
}

/**
 * Converts documented Catalog authentication, authorization, conflict, and
 * throttling responses into stable MCP error codes.
 * @param error - Error raised by the official Catalog client.
 * @param fallbackMessage - Safe message used for other upstream failures.
 * @returns A structured MCP error that preserves the original cause.
 */
function toCatalogMcpError(error: unknown, fallbackMessage: string): McpHarnessError {
  const statusCode = getUpstreamStatus(error);
  const options = { cause: error };
  if (statusCode === 401) {
    return new McpHarnessError(
      McpErrorCode.AUTHENTICATION_REQUIRED,
      'Backstage rejected the configured external-access token',
      { statusCode },
      options
    );
  }
  if (statusCode === 403) {
    return new McpHarnessError(
      McpErrorCode.INSUFFICIENT_PERMISSIONS,
      'The configured Backstage token is not permitted to perform this operation',
      { statusCode },
      options
    );
  }
  if (statusCode === 409) {
    return new McpHarnessError(
      McpErrorCode.CONFLICT,
      'The Backstage Catalog operation conflicts with existing state',
      {
        statusCode,
      },
      options
    );
  }
  if (statusCode === 429) {
    return new McpHarnessError(
      McpErrorCode.RATE_LIMITED,
      'Backstage rate limited the Catalog operation',
      { statusCode },
      options
    );
  }
  return new McpUpstreamError(fallbackMessage, options);
}

/**
 * Creates the initial or cursor-only request expected by the official Catalog client.
 * @param input - Validated MCP query parameters.
 * @returns A current Backstage query request; cursor requests intentionally ignore initial-query fields.
 */
function toQueryEntitiesRequest(input: Readonly<GetEntitiesInput>): QueryEntitiesRequest {
  if (input.cursor) {
    return { cursor: input.cursor, fields: input.fields, limit: input.limit };
  }
  return {
    fields: input.fields,
    limit: input.limit,
    offset: input.offset,
    filter: input.filter,
    orderFields: input.orderFields,
    fullTextFilter: input.fullTextFilter,
    totalItems: input.totalItems,
  };
}

export const getEntityByRefInputSchema = z.object({
  entityRef: z.union([
    z.string().min(1),
    z.object({
      kind: z.string().min(1),
      namespace: z.string().min(1),
      name: z.string().min(1),
    }),
  ]),
});

export const addLocationInputSchema = z.object({
  type: z.string().min(1).optional(),
  target: z.string().min(1),
  dryRun: z.boolean().optional(),
  onConflict: z.enum(['reject', 'refresh']).optional(),
});

const successOutputSchema = z.object({ status: z.literal('success'), data: z.unknown() });

const getEntitiesTool = defineTool<BackstageMcpContext>()({
  name: 'get_entities',
  title: 'Get catalog entities',
  description: 'Query Backstage catalog entities with filters, full-text search, ordering, and cursor pagination.',
  inputSchema: getEntitiesInputSchema,
  outputSchema: successOutputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  policy: { timeoutMs: 30_000, cache: { ttlMs: 120_000, tags: ['catalog'] } },
  /**
   * Queries catalog entities using validated filters and pagination.
   * @param invocation - Typed tool input and the Backstage application context.
   * @returns A structured success result containing the catalog response.
   * @throws {McpUpstreamError} When Backstage rejects or cannot complete the request.
   */
  async handler({ input, context }) {
    try {
      const data = await context.catalogClient.queryEntities(toQueryEntitiesRequest(input));
      return jsonResult({ status: 'success' as const, data });
    } catch (error) {
      throw toCatalogMcpError(error, 'Backstage could not return catalog entities');
    }
  },
});

const getEntityByRefTool = defineTool<BackstageMcpContext>()({
  name: 'get_entity_by_ref',
  title: 'Get a catalog entity',
  description: 'Get one Backstage catalog entity by its compound reference.',
  inputSchema: getEntityByRefInputSchema,
  outputSchema: successOutputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  policy: { timeoutMs: 30_000, cache: { ttlMs: 120_000, tags: ['catalog'] } },
  /**
   * Resolves one entity by a string or compound entity reference.
   * @param invocation - Typed tool input and the Backstage application context.
   * @returns A structured success result containing the entity.
   * @throws {McpNotFoundError} When the referenced entity does not exist.
   * @throws {McpUpstreamError} When Backstage cannot complete the request.
   */
  async handler({ input, context }) {
    const entityRef =
      typeof input.entityRef === 'string'
        ? input.entityRef
        : `${input.entityRef.kind}:${input.entityRef.namespace}/${input.entityRef.name}`;
    try {
      const data = await context.catalogClient.getEntityByRef(entityRef);
      if (!data) throw new McpNotFoundError('Catalog entity', entityRef);
      return jsonResult({ status: 'success' as const, data });
    } catch (error) {
      if (error instanceof McpNotFoundError) throw error;
      throw toCatalogMcpError(error, 'Backstage could not return the catalog entity');
    }
  },
});

const addLocationTool = defineTool<BackstageMcpContext>()({
  name: 'add_location',
  title: 'Add a catalog location',
  description: 'Add a location to the Backstage catalog, or validate it using dry-run mode.',
  inputSchema: addLocationInputSchema,
  outputSchema: successOutputSchema,
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  policy: {
    timeoutMs: 30_000,
    rateLimit: { maxRequests: 50, windowMs: 60_000 },
    invalidates: ['catalog'],
  },
  /**
   * Adds or dry-runs a catalog location and invalidates catalog cache entries.
   * @param invocation - Typed tool input and the Backstage application context.
   * @returns A structured success result containing the location response.
   * @throws {McpUpstreamError} When Backstage cannot add or validate the location.
   */
  async handler({ input, context }) {
    try {
      const data = await context.catalogClient.addLocation(input);
      return jsonResult({ status: 'success' as const, data });
    } catch (error) {
      throw toCatalogMcpError(error, 'Backstage could not add the catalog location');
    }
  },
});

export const backstageCatalogPlugin = definePlugin<BackstageMcpContext>({
  name: 'backstage-catalog',
  version: '2.0.0',
  description: 'Backstage Catalog MCP tools',
  features: [addLocationTool, getEntitiesTool, getEntityByRefTool],
});
