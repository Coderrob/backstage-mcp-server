/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import type { BackstageMcpContext } from '../../types/index.js';
import {
  catalogReadPolicy,
  catalogResult,
  entityRefSchema,
  readAnnotations,
  successOutputSchema,
  toEntityRef,
} from './shared.js';

const inputSchema = z.object({ entityRef: entityRefSchema });

/** Retrieves the ancestry tree for one Catalog entity. */
export const getEntityAncestorsTool = defineTool<BackstageMcpContext>()({
  name: 'get_entity_ancestors',
  title: 'Get catalog entity ancestors',
  description: 'Retrieve the ancestry tree for a Backstage Catalog entity.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Resolves the entity reference and retrieves its ancestors.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.getEntityAncestors({ entityRef: toEntityRef(input.entityRef) }),
      'Backstage could not return catalog entity ancestors'
    );
  },
});
