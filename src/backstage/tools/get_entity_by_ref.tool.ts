/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import type { BackstageMcpContext } from '../../types/index.js';
import {
  catalogOptionalResult,
  catalogReadPolicy,
  entityRefSchema,
  readAnnotations,
  successOutputSchema,
  toEntityRef,
} from './shared.js';

/** Input accepted by the single-entity lookup tool. */
const getEntityByRefInputSchema = z.object({ entityRef: entityRefSchema });

/** Retrieves one Catalog entity by compound reference. */
export const getEntityByRefTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_ENTITY_BY_REF,
  title: 'Get a catalog entity',
  description: 'Retrieve one Backstage Catalog entity by string or structured compound reference.',
  inputSchema: getEntityByRefInputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Resolves one entity reference and reports a typed not-found error when absent.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    const entityRef = toEntityRef(input.entityRef);
    return catalogOptionalResult(
      context.catalogClient.getEntityByRef(entityRef),
      'Catalog entity',
      entityRef,
      'Backstage could not return the catalog entity'
    );
  },
});
