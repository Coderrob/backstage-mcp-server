/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogOptionalResult, catalogReadPolicy, readAnnotations, successOutputSchema } from './shared.js';

const inputSchema = z.object({ locationRef: z.string().min(1) });

/** Retrieves a Catalog location by reference. */
export const getLocationByRefTool = defineTool<BackstageMcpContext>()({
  name: 'get_location_by_ref',
  title: 'Get catalog location by reference',
  description: 'Retrieve a Backstage Catalog location by its location reference.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Retrieves the referenced location and reports a typed not-found error when absent.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogOptionalResult(
      context.catalogClient.getLocationByRef(input.locationRef),
      'Catalog location',
      input.locationRef,
      'Backstage could not return the catalog location'
    );
  },
});
