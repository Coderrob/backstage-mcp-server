/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { defineTool } from '../../mcp/definitions.js';
import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import type { BackstageMcpContext } from '../../types/index.js';
import {
  catalogReadPolicy,
  catalogResult,
  queryEntitiesInputSchema,
  readAnnotations,
  successOutputSchema,
  toQueryEntitiesRequest,
} from './shared.js';

/** Compatibility alias for querying Catalog entities by filter. */
export const getEntitiesByQueryTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITIES_BY_QUERY,
  title: 'Get catalog entities by query',
  description: 'Query Catalog entities using the legacy name with current Backstage query capabilities.',
  inputSchema: queryEntitiesInputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Runs the compatibility entity-query operation.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.queryEntities(toQueryEntitiesRequest(input)),
      'Backstage could not return queried catalog entities'
    );
  },
});
