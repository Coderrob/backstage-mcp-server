/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogResult, catalogWritePolicy, destructiveAnnotations, successOutputSchema } from './shared.js';

const inputSchema = z.object({ locationId: z.string().min(1) });

/** Permanently removes one Catalog location by identifier. */
export const removeLocationByIdTool = defineTool<BackstageMcpContext>()({
  name: 'remove_location_by_id',
  title: 'Remove a catalog location',
  description: 'Permanently remove a Backstage Catalog location by its identifier.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: destructiveAnnotations,
  policy: catalogWritePolicy,
  /**
   * Removes the selected Catalog location.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.removeLocationById(input.locationId),
      'Backstage could not remove the catalog location'
    );
  },
});
