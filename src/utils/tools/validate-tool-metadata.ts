import { RawToolMetadata, rawToolMetadataSchema } from '../../types';

export function validateToolMetadata(metadata: unknown, fileName: string): asserts metadata is RawToolMetadata {
  const parsed = rawToolMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    console.error(`Invalid tool metadata in ${fileName}:`, parsed.error.format());
    throw new Error(`Tool metadata validation failed for ${fileName}`);
  }
}
