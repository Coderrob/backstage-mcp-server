/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { z } from 'zod';

import { defineTool } from '../../mcp/definitions.js';
import type { BackstageMcpContext } from '../../types/index.js';
import { catalogOperationPolicy, catalogResult, readAnnotations, successOutputSchema } from './shared.js';

type JsonValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };

const jsonValueSchema = z.custom<JsonValue>();
const entitySchema = z
  .object({
    apiVersion: z.string().min(1),
    kind: z.string().min(1),
    metadata: z.object({ name: z.string().min(1) }).catchall(jsonValueSchema),
  })
  .catchall(jsonValueSchema);
const inputSchema = z.object({ entity: entitySchema, locationRef: z.string().min(1) });

/** Validates an entity using Backstage Catalog processing rules. */
export const validateEntityTool = defineTool<BackstageMcpContext>()({
  name: 'validate_entity',
  title: 'Validate a catalog entity',
  description: 'Validate a Backstage entity descriptor in the context of its source location.',
  inputSchema,
  outputSchema: successOutputSchema,
  annotations: readAnnotations,
  policy: catalogOperationPolicy,
  /**
   * Submits the entity descriptor to official Catalog validation.
   * @param invocation - Validated tool input and Backstage application context.
   * @returns Structured MCP success result.
   */
  async handler({ input, context }) {
    return catalogResult(
      context.catalogClient.validateEntity(input.entity, input.locationRef),
      'Backstage could not validate the catalog entity'
    );
  },
});
