/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogResult, catalogWritePolicy, destructiveAnnotations, successOutputSchema } from './shared.js';

const inputSchema = z.object({ uid: z.string().uuid() });

/** Permanently removes one Catalog entity by UID. */
export const removeEntityByUidTool = defineTool<BackstageMcpContext>()({
  name: BackstageToolName.REMOVE_ENTITY_BY_UID,
  title: 'Remove a catalog entity',
  description: 'Permanently remove a Backstage Catalog entity by its unique identifier.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: destructiveAnnotations,
  policy: catalogWritePolicy,
  /**
   * Removes the selected Catalog entity.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.removeEntityByUid(input.uid),
      'Backstage could not remove the catalog entity'
    );
  },
});
