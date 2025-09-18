import { z } from 'zod';

import { RawToolMetadata, rawToolMetadataSchema } from '../../types/tools.js';

/**
 * Validates tool metadata against the expected schema.
 * Throws an error if the metadata is invalid or malformed.
 * @param metadata - The metadata object to validate
 * @param fileName - The file name where the metadata is defined (for error reporting)
 * @throws Error if the metadata fails validation
 */
export function validateToolMetadata(metadata: unknown, fileName: string): asserts metadata is RawToolMetadata {
  // First try to validate as RawToolMetadata (with plain object paramsSchema)
  const parsed = rawToolMetadataSchema.safeParse(metadata);
  if (parsed.success) {
    return;
  }

  // If that fails, try to validate as IToolMetadata (with Zod schema paramsSchema)
  const zodSchema = rawToolMetadataSchema.extend({
    paramsSchema: rawToolMetadataSchema.shape.paramsSchema.or(z.any()),
  });

  const zodParsed = zodSchema.safeParse(metadata);
  if (!zodParsed.success) {
    console.error(`Invalid tool metadata in ${fileName}:`, zodParsed.error.format());
    throw new Error(`Tool metadata validation failed for ${fileName}`);
  }
}
