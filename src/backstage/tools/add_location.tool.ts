/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogResult, catalogWritePolicy, successOutputSchema, writeAnnotations } from './shared.js';

/** Input accepted when registering or dry-running a Catalog location. */
const addLocationInputSchema = z.object({
  type: z.string().min(1).optional(),
  target: z.string().min(1),
  dryRun: z.boolean().optional(),
  onConflict: z.enum(['reject', 'refresh']).optional(),
});

/** Adds a location to the Backstage Catalog. */
export const addLocationTool = defineTool<BackstageMcpContext>()({
  name: 'add_location',
  title: 'Add a catalog location',
  description: 'Add a location to the Backstage Catalog, or validate it using dry-run mode.',
  inputSchema: addLocationInputSchema,
  outputSchema: successOutputSchema,
  annotations: writeAnnotations,
  policy: catalogWritePolicy,
  /**
   * Adds or dry-runs a Catalog location.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(context.catalogClient.addLocation(input), 'Backstage could not add the catalog location');
  },
});
