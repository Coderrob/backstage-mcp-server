/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import type { BackstageMcpContext } from '../../types/index.js';
import {
  catalogReadPolicy,
  catalogResult,
  entityRefSchema,
  fieldsSchema,
  readAnnotations,
  successOutputSchema,
  toEntityRef,
} from './shared.js';

const inputSchema = z.object({ entityRefs: z.array(entityRefSchema).min(1), fields: fieldsSchema });

/** Retrieves multiple Catalog entities by reference. */
export const getEntitiesByRefsTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITIES_BY_REFS,
  title: 'Get catalog entities by references',
  description: 'Retrieve multiple Backstage Catalog entities by string or structured compound references.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Retrieves all requested entities in one official-client operation.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    const request = { entityRefs: input.entityRefs.map(toEntityRef), fields: input.fields };
    return catalogResult(
      context.catalogClient.getEntitiesByRefs(request),
      'Backstage could not return catalog entities by reference'
    );
  },
});
