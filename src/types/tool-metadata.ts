import { z } from 'zod';

/**
 * RawToolMetadata represents metadata as it appears in a file/manifest
 * (paramsSchema is a plain object shape when authored in JSON/JS).
 */
export const rawToolMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  paramsSchema: z.record(z.any()).optional(),
});

export type RawToolMetadata = z.infer<typeof rawToolMetadataSchema>;

/**
 * IToolMetadata is the runtime form used by the registrar/factory: paramsSchema
 * is a Zod schema (z.ZodTypeAny).
 */
export interface IToolMetadata {
  name: string;
  description: string;
  paramsSchema?: z.ZodTypeAny;
}
