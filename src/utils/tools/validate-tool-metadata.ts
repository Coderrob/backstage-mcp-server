import { RawToolMetadata, rawToolMetadataSchema } from '../../types/tools.js';

/**
 * Validates tool metadata against the expected schema.
 * Throws an error if the metadata is invalid or malformed.
 * @param metadata - The metadata object to validate
 * @param fileName - The file name where the metadata is defined (for error reporting)
 * @throws Error if the metadata fails validation
 */
export function validateToolMetadata(metadata: unknown, fileName: string): asserts metadata is RawToolMetadata {
  const parsed = rawToolMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    console.error(`Invalid tool metadata in ${fileName}:`, parsed.error.format());
    throw new Error(`Tool metadata validation failed for ${fileName}`);
  }
}
