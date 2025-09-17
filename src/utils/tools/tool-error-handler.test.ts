import { jest } from '@jest/globals';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { ApiStatus } from '../../types/apis.js';
import { IToolRegistrationContext } from '../../types/tools.js';
import { ToolErrorHandler } from './tool-error-handler.js';

// Mock dependencies
jest.mock('../core/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('ToolErrorHandler', () => {
  let mockContext: IToolRegistrationContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockToolFn: jest.MockedFunction<(args: any, context: IToolRegistrationContext) => Promise<CallToolResult>>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    mockContext = {} as IToolRegistrationContext;
    mockToolFn = jest.fn();
  });

  describe('executeTool', () => {
    it('should execute tool successfully and return result', async () => {
      const args = { key: 'value' };
      const expectedResult: CallToolResult = { content: [{ type: 'text', text: 'success' }] };
      mockToolFn.mockResolvedValue(expectedResult);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext);

      expect(mockToolFn).toHaveBeenCalledWith(args, mockContext);
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors with simple format when useJsonApi is false', async () => {
      const args = { key: 'value' };
      const error = new Error('Test error');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, false);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed).toEqual({
        data: {
          message: 'Failed to testOp: Test error',
        },
        status: ApiStatus.ERROR,
      });
    });

    it('should handle errors with JSON:API format when useJsonApi is true', async () => {
      const args = { key: 'value' };
      const error = new Error('Validation failed');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.status).toBe(ApiStatus.ERROR);
      expect(parsed.data.message).toBe('Validation failed');
      expect(parsed.data.code).toBe('VALIDATION_ERROR');
      expect(parsed.data.source).toEqual({ tool: 'testTool', operation: 'testOp' });
      expect(parsed.errors).toHaveLength(1);
    });

    it('should classify unknown errors correctly', async () => {
      const args = {};
      const error = 'string error';
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, false);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed).toEqual({
        data: {
          message: 'Failed to testOp: Unknown error',
        },
        status: ApiStatus.ERROR,
      });
    });

    it('should classify validation errors', async () => {
      const args = {};
      const error = new Error('Invalid input');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.data.code).toBe('VALIDATION_ERROR');
    });

    it('should classify authentication errors', async () => {
      const args = {};
      const error = new Error('Unauthorized access');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.data.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should classify authorization errors', async () => {
      const args = {};
      const error = new Error('Forbidden permission');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.data.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should classify not found errors', async () => {
      const args = {};
      const error = new Error('Resource not found');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.data.code).toBe('NOT_FOUND');
    });

    it('should classify conflict errors', async () => {
      const args = {};
      const error = new Error('Conflict already exists');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.data.code).toBe('CONFLICT');
    });

    it('should classify rate limit errors', async () => {
      const args = {};
      const error = new Error('Rate limit exceeded');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.data.code).toBe('RATE_LIMIT');
    });

    it('should classify network errors', async () => {
      const args = {};
      const error = new Error('Network timeout');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.data.code).toBe('NETWORK_ERROR');
    });

    it('should classify Backstage API errors', async () => {
      const args = {};
      const error = new Error('Backstage API error');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.data.code).toBe('BACKSTAGE_API_ERROR');
    });

    it('should default to internal error for unclassified errors', async () => {
      const args = {};
      const error = new Error('Some random error');
      mockToolFn.mockRejectedValue(error);

      const result = await ToolErrorHandler.executeTool('testTool', 'testOp', mockToolFn, args, mockContext, true);

      const parsed = JSON.parse(result.content[0].text as string);
      expect(parsed.data.code).toBe('INTERNAL_ERROR');
    });
  });
});
