/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import type { BackstageMcpContext } from '../../types/index.js';
import {
  catalogResult,
  catalogWritePolicy,
  entityRefSchema,
  successOutputSchema,
  toEntityRef,
  writeAnnotations,
} from './shared.js';

const inputSchema = z.object({ entityRef: entityRefSchema });

/** Requests a refresh of one Catalog entity. */
export const refreshEntityTool = defineTool<BackstageMcpContext>()({
  name: 'refresh_entity',
  title: 'Refresh a catalog entity',
  description: 'Request immediate refresh processing for a Backstage Catalog entity.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: writeAnnotations,
  policy: catalogWritePolicy,
  /**
   * Resolves the entity reference and requests a refresh.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.refreshEntity(toEntityRef(input.entityRef)),
      'Backstage could not refresh the catalog entity'
    );
  },
});
