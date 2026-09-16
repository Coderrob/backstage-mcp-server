/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { defineTool } from '../../mcp/definitions.js';
import type { BackstageMcpContext } from '../../types/index.js';
import {
  catalogReadPolicy,
  catalogResult,
  queryEntitiesInputSchema,
  readAnnotations,
  successOutputSchema,
  toQueryEntitiesRequest,
} from './shared.js';

/** Queries Backstage Catalog entities with the current query API. */
export const getEntitiesTool = defineTool<BackstageMcpContext>()({
  name: 'get_entities',
  title: 'Get catalog entities',
  description: 'Query Catalog entities with filters, full-text search, ordering, projection, and pagination.',
  inputSchema: queryEntitiesInputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Queries Catalog entities using validated current or cursor parameters.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.queryEntities(toQueryEntitiesRequest(input)),
      'Backstage could not return catalog entities'
    );
  },
});
