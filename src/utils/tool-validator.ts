import { ToolMetadata, ToolValidator } from '../types';
import { validateToolMetadata } from '../utils/validate-tool-metadata';

export class DefaultToolValidator implements ToolValidator {
  validate(metadata: ToolMetadata, file: string): void {
    validateToolMetadata(metadata, file);
  }
}
