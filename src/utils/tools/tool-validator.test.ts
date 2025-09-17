import { jest } from '@jest/globals';

import { IToolMetadata } from '../../types/tools.js';
import { DefaultToolValidator } from './tool-validator.js';

// Mock the validation function
jest.mock('./validate-tool-metadata.js', () => ({
  validateToolMetadata: jest.fn(),
}));

describe('DefaultToolValidator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let validator: DefaultToolValidator;

  beforeEach(() => {
    validator = new DefaultToolValidator();
  });

  describe('validate', () => {
    it('should validate correct metadata without throwing', () => {
      const metadata: IToolMetadata = {
        name: 'test-tool',
        description: 'Test tool',
      };
      const file = '/path/to/tool.js';

      expect(() => validator.validate(metadata, file)).not.toThrow();
    });
    it('should throw for invalid metadata', () => {
      const metadata = {
        name: '', // Invalid: empty name
        description: 'Test tool',
      };
      const file = '/path/to/tool.js';

      expect(() => validator.validate(metadata, file)).toThrow();
    });
  });
});
