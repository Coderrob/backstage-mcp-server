import { IToolMetadata, IToolValidator } from '../../types/tools.js';
import { validateToolMetadata } from './validate-tool-metadata.js';

export class DefaultToolValidator implements IToolValidator {
  validate(metadata: IToolMetadata, file: string): void {
    validateToolMetadata(metadata, file);
  }
}
