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

const inputSchema = z.object({ entityRef: entityRefSchema });

/** Retrieves the Catalog location associated with an entity. */
export const getLocationByEntityTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.GET_LOCATION_BY_ENTITY,
  title: 'Get catalog location by entity',
  description: 'Retrieve the Backstage Catalog location associated with an entity.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogReadPolicy,
  /**
   * Resolves the entity reference and retrieves its source location.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    const entityRef = toEntityRef(input.entityRef);
    return catalogOptionalResult(
      context.catalogClient.getLocationByEntity(entityRef),
      'Catalog location for entity',
      entityRef,
      'Backstage could not return the entity location'
    );
  },
});
