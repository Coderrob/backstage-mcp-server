import { z } from 'zod';

const toolMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  paramsSchema: z.record(z.any()).optional(),
});

export function validateToolMetadata(
  metadata: unknown,
  fileName: string
): asserts metadata is {
  name: string;
  description: string;
  paramsSchema?: unknown;
} {
  const parsed = toolMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    console.error(
      `Invalid tool metadata in ${fileName}:`,
      parsed.error.format()
    );
    throw new Error(`Tool metadata validation failed for ${fileName}`);
  }
}
