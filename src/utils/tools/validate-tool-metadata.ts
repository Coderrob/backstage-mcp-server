/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { z } from 'zod';

import { IToolMetadata, RawToolMetadata, rawToolMetadataSchema } from '../../types/tools.js';

/**
 * Result of tool metadata validation with discriminated union
 */
export type ToolMetadataValidationResult =
  | { type: 'raw'; metadata: RawToolMetadata }
  | { type: 'runtime'; metadata: IToolMetadata };

/**
 * Validates tool metadata and returns a discriminated result indicating the type.
 * This provides type safety by distinguishing between RawToolMetadata and IToolMetadata.
 * @param metadata - The metadata object to validate
 * @param fileName - The file name where the metadata is defined (for error reporting)
 * @returns Validation result with discriminated type
 * @throws Error if the metadata fails validation against both schemas
 */
export function validateToolMetadata(metadata: unknown, fileName: string): ToolMetadataValidationResult {
  // First try to validate as RawToolMetadata (with plain object paramsSchema)
  const rawParsed = rawToolMetadataSchema.safeParse(metadata);
  if (rawParsed.success) {
    return { type: 'raw', metadata: rawParsed.data };
  }

  // If that fails, try to validate as IToolMetadata (with Zod schema paramsSchema)
  const runtimeSchema = rawToolMetadataSchema.extend({
    paramsSchema: z.any(), // Allow any type for paramsSchema in runtime form
  });

  const runtimeParsed = runtimeSchema.safeParse(metadata);
  if (runtimeParsed.success) {
    return { type: 'runtime', metadata: runtimeParsed.data as IToolMetadata };
  }

  // If both validations fail, throw an error with details
  const rawError = rawParsed.error.format();
  const runtimeError = runtimeParsed.error.format();

  console.error(`Invalid tool metadata in ${fileName}:`);
  console.error('RawToolMetadata validation errors:', rawError);
  console.error('IToolMetadata validation errors:', runtimeError);

  throw new Error(`Tool metadata validation failed for ${fileName}`);
}

/**
 * Validates tool metadata and asserts it is RawToolMetadata.
 * Use this when you specifically need RawToolMetadata (e.g., when loading from files).
 * @param metadata - The metadata object to validate
 * @param fileName - The file name where the metadata is defined (for error reporting)
 * @throws Error if the metadata is not valid RawToolMetadata
 */
export function validateRawToolMetadata(metadata: unknown, fileName: string): asserts metadata is RawToolMetadata {
  const result = validateToolMetadata(metadata, fileName);

  if (result.type !== 'raw') {
    throw new Error(`Expected RawToolMetadata but got runtime IToolMetadata in ${fileName}`);
  }
}

/**
 * Validates tool metadata and asserts it is IToolMetadata.
 * Use this when you specifically need IToolMetadata (e.g., at runtime).
 * @param metadata - The metadata object to validate
 * @param fileName - The file name where the metadata is defined (for error reporting)
 * @throws Error if the metadata is not valid IToolMetadata
 */
export function validateRuntimeToolMetadata(metadata: unknown, fileName: string): asserts metadata is IToolMetadata {
  const result = validateToolMetadata(metadata, fileName);

  if (result.type !== 'runtime') {
    throw new Error(`Expected IToolMetadata but got raw RawToolMetadata in ${fileName}`);
  }
}
