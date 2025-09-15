import { IToolMetadata, IToolValidator } from '../types';
import { DefaultToolValidator } from './tool-validator';
import * as validateToolMetadataModule from './validate-tool-metadata';

describe('DefaultToolValidator', () => {
  let validator: IToolValidator;

  beforeEach(() => {
    validator = new DefaultToolValidator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call validateToolMetadata with correct arguments', () => {
    const metadata: IToolMetadata = { name: 'test-tool', version: '1.0.0' } as unknown as IToolMetadata;
    const file = 'tool-file.yaml';
    const spy = jest.spyOn(validateToolMetadataModule, 'validateToolMetadata').mockImplementationOnce(() => {});

    validator.validate(metadata, file);

    expect(spy).toHaveBeenCalledWith(metadata, file);
    spy.mockRestore();
  });
});
