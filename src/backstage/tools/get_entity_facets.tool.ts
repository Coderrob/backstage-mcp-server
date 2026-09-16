/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import type { BackstageMcpContext } from '../../types/index.js';
import {
  catalogFilterSchema,
  catalogReadPolicy,
  catalogResult,
  readAnnotations,
  successOutputSchema,
} from './shared.js';

const inputSchema = z.object({ filter: catalogFilterSchema.optional(), facets: z.array(z.string().min(1)).min(1) });

/** Retrieves aggregate facet values for Catalog entity fields. */
export const getEntityFacetsTool = defineTool<BackstageMcpContext>()({
  name: 'get_entity_facets',
  title: 'Get catalog entity facets',
  description: 'Retrieve facet counts for one or more Backstage Catalog entity fields.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Retrieves facet values using the validated filter and field list.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.getEntityFacets(input),
      'Backstage could not return catalog entity facets'
    );
  },
});
