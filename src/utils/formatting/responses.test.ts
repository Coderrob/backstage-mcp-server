import { Entity } from '@backstage/catalog-model';
import { jest } from '@jest/globals';

import { ApiStatus } from '../../types/apis.js';
import { ResponseMessage } from '../../types/constants.js';
import {
  createSimpleError,
  createStandardError,
  ErrorType,
  formatEntity,
  formatEntityList,
  formatLocation,
  FormattedTextResponse,
  JsonToTextResponse,
  MultiContentResponse,
  TextResponse,
} from './responses.js';

describe('responses', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('TextResponse', () => {
    it('should create a text response', () => {
      const result = TextResponse('Hello world');
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Hello world' }],
      });
    });
  });

  describe('JsonToTextResponse', () => {
    it('should create a JSON text response', () => {
      const data = { status: ApiStatus.SUCCESS, data: { key: 'value' } };
      const result = JsonToTextResponse(data);
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(data, expect.any(Function), 2) }],
      });
    });

    it('should handle BigInt values', () => {
      const data = { status: ApiStatus.SUCCESS, data: { big: 123n } };
      const result = JsonToTextResponse(data);
      expect(result.content[0].text).toContain('"big": "123"');
    });
  });

  describe('FormattedTextResponse', () => {
    it('should format error response', () => {
      const data = { status: ApiStatus.ERROR, data: { message: 'Test error' } };
      const result = FormattedTextResponse(data);
      expect(result).toEqual({
        content: [{ type: 'text', text: `${ResponseMessage.ERROR_PREFIX}: Test error` }],
      });
    });

    it('should format error response with unknown message', () => {
      const data = { status: ApiStatus.ERROR, data: {} };
      const result = FormattedTextResponse(data);
      expect(result).toEqual({
        content: [{ type: 'text', text: `${ResponseMessage.ERROR_PREFIX}: ${ResponseMessage.UNKNOWN_ERROR}` }],
      });
    });

    it('should format success response with custom formatter', () => {
      const data = { status: ApiStatus.SUCCESS, data: 'custom' };
      const formatter = jest.fn(() => 'Custom formatted');
      const result = FormattedTextResponse(data, formatter);
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Custom formatted' }],
      });
      expect(formatter).toHaveBeenCalledWith(data);
    });

    it('should format success response with data', () => {
      const data = { status: ApiStatus.SUCCESS, data: { key: 'value' } };
      const result = FormattedTextResponse(data);
      expect(result).toEqual({
        content: [{ type: 'text', text: `${ResponseMessage.SUCCESS_PREFIX}: ${JSON.stringify(data.data, null, 2)}` }],
      });
    });

    it('should format success response without data', () => {
      const data = { status: ApiStatus.SUCCESS };
      const result = FormattedTextResponse(data);
      expect(result).toEqual({
        content: [{ type: 'text', text: ResponseMessage.SUCCESS_PREFIX }],
      });
    });
  });

  describe('MultiContentResponse', () => {
    it('should create multi-content for error', () => {
      const data = { status: ApiStatus.ERROR, data: { message: 'Error' } };
      const result = MultiContentResponse(data);
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({ type: 'text', text: 'Error: Error' });
      expect(result.content[1].type).toBe('text');
      expect(result.content[1].text).toContain('"status": "error"');
    });

    it('should create multi-content for success with formatter', () => {
      const data = { status: ApiStatus.SUCCESS, data: 'data' };
      const formatter = jest.fn(() => 'Formatted');
      const result = MultiContentResponse(data, formatter);
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({ type: 'text', text: 'Formatted' });
      expect(formatter).toHaveBeenCalledWith(data);
    });

    it('should create multi-content for success without data', () => {
      const data = { status: ApiStatus.SUCCESS };
      const result = MultiContentResponse(data);
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({ type: 'text', text: ResponseMessage.SUCCESS_PREFIX });
    });
  });

  describe('formatEntityList', () => {
    it('should format empty list', () => {
      const data = { status: ApiStatus.SUCCESS, data: [] } as const;
      expect(formatEntityList(data)).toBe(`${ResponseMessage.SUCCESS_PREFIX}: ${ResponseMessage.NO_ENTITIES_FOUND}`);
    });

    it('should format null data', () => {
      const data = { status: ApiStatus.SUCCESS, data: null } as const;
      expect(formatEntityList(data)).toBe('No entities found');
    });

    it('should format non-array data', () => {
      const data = { status: ApiStatus.SUCCESS, data: 'not array' } as const;
      expect(formatEntityList(data)).toBe('No entities found');
    });

    it('should format list with entities', () => {
      const data = {
        status: ApiStatus.SUCCESS,
        data: [
          { kind: 'Component', metadata: { name: 'comp1' } },
          { kind: 'Component', metadata: { name: 'comp2' } },
          { kind: 'API', metadata: { name: 'api1' } },
        ],
      } as const;
      expect(formatEntityList(data)).toBe('Found 3 entities (Component: 2, API: 1)');
    });
  });

  describe('formatEntity', () => {
    it('should format null entity', () => {
      const data = { status: ApiStatus.SUCCESS, data: undefined } as const;
      expect(formatEntity(data)).toBe(`${ResponseMessage.SUCCESS_PREFIX}: ${ResponseMessage.ENTITY_NOT_FOUND}`);
    });

    it('should format entity with all fields', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'my-comp',
          namespace: 'default',
          title: 'My Component',
          description: 'A test component',
          tags: ['tag1', 'tag2'],
        },
        spec: {},
      };
      const data = { status: ApiStatus.SUCCESS, data: entity } as const;
      const result = formatEntity(data);
      expect(result).toContain('Found Component entity: default/my-comp');
      expect(result).toContain('Title: My Component');
      expect(result).toContain('Description: A test component');
      expect(result).toContain('Tags: tag1, tag2');
    });

    it('should format entity with defaults', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: {
          name: 'my-api',
        },
        spec: {},
      };
      const data = { status: ApiStatus.SUCCESS, data: entity } as const;
      const result = formatEntity(data);
      expect(result).toContain('Found API entity: default/my-api');
      expect(result).toContain('Title: No title');
      expect(result).toContain('Description: No description');
      expect(result).toContain('Tags: None');
    });
  });

  describe('formatLocation', () => {
    it('should format null location', () => {
      const data = { status: ApiStatus.SUCCESS, data: undefined } as const;
      expect(formatLocation(data)).toBe(`${ResponseMessage.SUCCESS_PREFIX}: ${ResponseMessage.LOCATION_NOT_FOUND}`);
    });

    it('should format location with all fields', () => {
      const data = {
        status: ApiStatus.SUCCESS,
        data: { id: 1, type: 'github', target: 'https://github.com/user/repo', tags: ['tag1'] },
      } as const;
      const result = formatLocation(data);
      expect(result).toContain('Location found:');
      expect(result).toContain('ID: 1');
      expect(result).toContain('Type: github');
      expect(result).toContain('Target: https://github.com/user/repo');
      expect(result).toContain('Tags: tag1');
    });

    it('should format location with defaults', () => {
      const data = { status: ApiStatus.SUCCESS, data: {} } as const;
      const result = formatLocation(data);
      expect(result).toContain('ID: unknown');
      expect(result).toContain('Type: unknown');
      expect(result).toContain('Target: unknown');
      expect(result).toContain('Tags: None');
    });
  });

  describe('createSimpleError', () => {
    it('should create simple error response', () => {
      const result = createSimpleError('Test message');
      expect(result).toEqual({
        status: ApiStatus.ERROR,
        data: { message: 'Test message' },
      });
    });
  });

  describe('createStandardError', () => {
    it('should create standard error with Error instance', () => {
      const error = new Error('Test error');
      const result = createStandardError(error, ErrorType.VALIDATION, 'test-tool', 'test-op');
      expect(result.status).toBe(ApiStatus.ERROR);
      expect(result.data.message).toBe('Test error');
      expect(result.data.code).toBe('VALIDATION_ERROR');
      expect(result.data.source?.tool).toBe('test-tool');
      expect(result.data.source?.operation).toBe('test-op');
      expect(result.data.errors).toHaveLength(1);
      expect(result.data.errors?.[0].status).toBe('400');
      expect(result.data.errors?.[0].title).toBe('Validation Error');
    });

    it('should create standard error with string error', () => {
      const result = createStandardError('String error', ErrorType.NOT_FOUND, 'tool', 'op', { extra: 'data' });
      expect(result.data.message).toBe('String error');
      expect(result.data.code).toBe('NOT_FOUND');
      expect(result.data.errors?.[0].status).toBe('404');
      expect(result.data.errors?.[0].meta?.extra).toBe('data');
    });

    it('should handle all error types', () => {
      Object.values(ErrorType).forEach((type) => {
        const result = createStandardError('error', type, 'tool', 'op');
        expect(result.data.code).toBe(type);
        expect(result.data.errors?.[0].status).toBeDefined();
        expect(result.data.errors?.[0].title).toBeDefined();
      });
    });
  });
});
