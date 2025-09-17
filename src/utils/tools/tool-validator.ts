import { IToolMetadata, IToolValidator } from '../../types/tools.js';
import { validateToolMetadata } from './validate-tool-metadata.js';

/**
 * Default implementation of IToolValidator that validates tool metadata.
 * Uses the validateToolMetadata function to perform validation.
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
    validateToolMetadata(metadata, file);
  }
}
