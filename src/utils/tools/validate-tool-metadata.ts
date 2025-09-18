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
