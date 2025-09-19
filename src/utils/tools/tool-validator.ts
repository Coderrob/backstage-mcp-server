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
import { IToolMetadata, IToolValidator } from '../../types/tools.js';
import { validateToolMetadata } from './validate-tool-metadata.js';

/**
 * Default implementation of IToolValidator that validates tool metadata.
 * Uses the validateToolMetadata function to perform validation with type safety.
 */
export class DefaultToolValidator implements IToolValidator {
  /**
   * Validates the provided tool metadata.
   * Throws an error if the metadata is invalid.
   * @param metadata - The tool metadata to validate
   * @param file - The file path where the tool is defined (for error reporting)
   * @throws Error if the metadata is invalid
   */
  validate(metadata: IToolMetadata, file: string): void {
    // Validate the metadata and ensure it's compatible with IToolMetadata
    const result = validateToolMetadata(metadata, file);

    // Both RawToolMetadata and IToolMetadata should be valid IToolMetadata at runtime
    // The discriminated result ensures type safety during validation
    if (result.type === 'raw' || result.type === 'runtime') {
      // Validation passed, metadata is valid
      return;
    }
  }
}
