import { RawToolMetadata } from '../types/tool-metadata';
import { validateToolMetadata } from './validate-tool-metadata';

describe('validateToolMetadata', () => {
  const validMetadata: RawToolMetadata = {
    name: 'Test Tool',
    description: 'A test tool',
    paramsSchema: { foo: 'bar' },
  };

  const validMetadataWithoutParams: RawToolMetadata = {
    name: 'Test Tool',
    description: 'A test tool',
  };

  it('does not throw for valid metadata with paramsSchema', () => {
    expect(() => validateToolMetadata(validMetadata, 'test-file.ts')).not.toThrow();
  });

  it('does not throw for valid metadata without paramsSchema', () => {
    expect(() => validateToolMetadata(validMetadataWithoutParams, 'test-file.ts')).not.toThrow();
  });

  it('throws and logs error for missing name', () => {
    const invalid = { description: 'desc', paramsSchema: {} };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => validateToolMetadata(invalid, 'bad-file.ts')).toThrow(/Tool metadata validation failed/);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid tool metadata in bad-file.ts:'),
      expect.any(Object)
    );
    spy.mockRestore();
  });

  it('throws and logs error for empty name', () => {
    const invalid = { name: '', description: 'desc' };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => validateToolMetadata(invalid, 'bad-file.ts')).toThrow(/Tool metadata validation failed/);
    spy.mockRestore();
  });

  it('throws and logs error for missing description', () => {
    const invalid = { name: 'Tool', paramsSchema: {} };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => validateToolMetadata(invalid, 'bad-file.ts')).toThrow(/Tool metadata validation failed/);
    spy.mockRestore();
  });

  it('throws and logs error for empty description', () => {
    const invalid = { name: 'Tool', description: '' };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => validateToolMetadata(invalid, 'bad-file.ts')).toThrow(/Tool metadata validation failed/);
    spy.mockRestore();
  });

  it('throws and logs error for completely invalid input', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => validateToolMetadata(null, 'bad-file.ts')).toThrow(/Tool metadata validation failed/);
    spy.mockRestore();
  });
});
