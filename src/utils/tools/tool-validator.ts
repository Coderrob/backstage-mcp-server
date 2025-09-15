import { IToolMetadata, IToolValidator } from '../../types';
import { validateToolMetadata } from './validate-tool-metadata';

export class DefaultToolValidator implements IToolValidator {
  validate(metadata: IToolMetadata, file: string): void {
    validateToolMetadata(metadata, file);
  }
}
