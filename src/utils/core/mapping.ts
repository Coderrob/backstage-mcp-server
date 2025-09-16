import { ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

/**
 * Converts a ZodType into a ZodRawShape if possible.
 * @param schema - The ZodType to attempt to convert.
 * @returns A ZodRawShape if the schema is a ZodObject, otherwise throws an error.
 */
export function toZodRawShape<T extends ZodTypeAny>(schema: T): ZodRawShape {
  if (schema instanceof ZodObject) {
    return schema.shape;
  }
  throw new TypeError('Provided schema is not a ZodObject and cannot be converted to a ZodRawShape.');
}
