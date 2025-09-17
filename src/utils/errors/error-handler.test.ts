// Mock logger
jest.mock('../core/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// Now import everything
import { jest } from '@jest/globals';
import { NextFunction, Request, Response } from 'express';

import { logger } from '../core/logger.js';
import { MCPError } from './custom-errors.js';
import {
  asyncErrorHandler,
  errorHandler,
  ErrorMetrics,
  errorMetrics,
  sanitizeRequestBody,
  withErrorHandling,
} from './error-handler.js';

// Test implementation of the abstract MCPError class
class TestMCPError extends MCPError {
  constructor(
    message: string,
    code: string = 'TEST_ERROR',
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, true, details);
  }
}

describe('ErrorMetrics', () => {
  beforeEach(() => {
    errorMetrics.reset();
  });

  it('should be a singleton', () => {
    const instance1 = ErrorMetrics.getInstance();
    const instance2 = ErrorMetrics.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should record MCPError', () => {
    const error = new TestMCPError('Test error', 'TEST_ERROR', 400);
    errorMetrics.recordError(error);
    expect(errorMetrics.getMetrics()).toEqual({ TEST_ERROR: 1 });
  });

  it('should record generic Error', () => {
    const error = new Error('Generic error');
    errorMetrics.recordError(error);
    expect(errorMetrics.getMetrics()).toEqual({ UNKNOWN_ERROR: 1 });
  });

  it('should get metrics', () => {
    errorMetrics.recordError(new TestMCPError('Server error', 'SERVER_ERROR', 500));
    errorMetrics.recordError(new Error('Another error'));
    expect(errorMetrics.getMetrics()).toEqual({ SERVER_ERROR: 1, UNKNOWN_ERROR: 1 });
  });

  it('should reset metrics', () => {
    errorMetrics.recordError(new Error('Test'));
    errorMetrics.reset();
    expect(errorMetrics.getMetrics()).toEqual({});
  });

  it('should get error rate (current implementation returns count)', () => {
    errorMetrics.recordError(new TestMCPError('Not found', 'NOT_FOUND', 404));
    expect(errorMetrics.getErrorRate('NOT_FOUND')).toBe(1);
    expect(errorMetrics.getErrorRate('UNKNOWN')).toBe(0);
  });
});

describe('errorHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      query: {},
      get: jest.fn<() => string | undefined>(),
    } as Partial<Request>;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;
    next = jest.fn();
    errorMetrics.reset();
  });

  it('should handle MCPError', () => {
    const error = new TestMCPError('Bad request', 'BAD_REQUEST', 400);
    const loggerErrorSpy = jest.spyOn(logger, 'error');

    errorHandler(error as Error, req as Request, res as Response, next);

    expect(errorMetrics.getMetrics()).toEqual({ BAD_REQUEST: 1 });
    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      error: {
        code: 400,
        message: 'Bad request',
        data: error.toClientObject(),
      },
      id: null,
    });
  });

  it('should handle generic Error', () => {
    const error = new Error('Generic error');
    errorHandler(error, req as Request, res as Response, next);

    expect(errorMetrics.getMetrics()).toEqual({ UNKNOWN_ERROR: 1 });
    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      error: {
        code: 500,
        message: 'Generic error',
        data: expect.any(Object),
      },
      id: null,
    });
  });
});

describe('sanitizeRequestBody', () => {
  it('should sanitize sensitive fields', () => {
    const body = {
      username: 'user',
      password: 'secret',
      token: 'abc123',
      other: 'value',
    };
    const sanitized = sanitizeRequestBody(body);
    expect(sanitized).toEqual({
      username: 'user',
      password: '[REDACTED]',
      token: '[REDACTED]',
      other: 'value',
    });
  });

  it('should handle non-object body', () => {
    expect(sanitizeRequestBody(null)).toBe(null);
    expect(sanitizeRequestBody('string')).toBe('string');
  });
});

describe('asyncErrorHandler', () => {
  it('should call next on error', async () => {
    const mockFn = async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
      throw new TestMCPError('Test error', 'TEST_ERROR', 400);
    };
    const fn = jest.fn<(req: Request, res: Response, next: NextFunction) => Promise<void>>(mockFn);
    const handler = asyncErrorHandler(fn);
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(new TestMCPError('Test error', 'TEST_ERROR', 400));
  });

  it('should not call next on success', async () => {
    const mockFn = async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
      return Promise.resolve();
    };
    const fn = jest.fn<(req: Request, res: Response, next: NextFunction) => Promise<void>>(mockFn);
    const handler = asyncErrorHandler(fn);
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn();

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});

describe('withErrorHandling', () => {
  beforeEach(() => {
    errorMetrics.reset();
  });

  it('should return result on success', async () => {
    const result = await withErrorHandling('test', async () => 'success');
    expect(result).toBe('success');
  });

  it('should record and re-throw error', async () => {
    const error = new Error('Operation failed');
    await expect(
      withErrorHandling('test', async () => {
        throw error;
      })
    ).rejects.toThrow(error);
    expect(errorMetrics.getMetrics()).toEqual({ UNKNOWN_ERROR: 1 });
    expect(logger.error).toHaveBeenCalledWith(
      'Operation failed: test',
      expect.objectContaining({
        error: { message: 'Operation failed', stack: expect.any(String) },
      })
    );
  });

  it('should handle MCPError', async () => {
    const error = new TestMCPError('Not found', 'NOT_FOUND', 404);
    await expect(
      withErrorHandling('test', async () => {
        throw error;
      })
    ).rejects.toThrow(error);
    expect(errorMetrics.getMetrics()).toEqual({ NOT_FOUND: 1 });
  });
});

describe('MCPError Abstract Base Class', () => {
  it('should create TestMCPError instance with correct properties', () => {
    const error = new TestMCPError('Test message', 'TEST_CODE', 418);

    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.statusCode).toBe(418);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('TestMCPError');
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should create TestMCPError with default values', () => {
    const error = new TestMCPError('Test message');

    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('should create TestMCPError with details', () => {
    const details = { field: 'username', reason: 'required' };
    const error = new TestMCPError('Validation failed', 'VALIDATION_ERROR', 400, details);

    expect(error.details).toEqual(details);
  });

  it('should convert to log object', () => {
    const details = { userId: '123' };
    const error = new TestMCPError('Access denied', 'AUTH_ERROR', 403, details);
    const logObject = error.toLogObject();

    expect(logObject).toEqual({
      name: 'TestMCPError',
      message: 'Access denied',
      code: 'AUTH_ERROR',
      statusCode: 403,
      isOperational: true,
      details,
      timestamp: expect.any(String),
      stack: expect.any(String),
    });
  });

  it('should convert to client object', () => {
    const details = { field: 'password', issue: 'too_short' };
    const error = new TestMCPError('Invalid input', 'INPUT_ERROR', 422, details);
    const clientObject = error.toClientObject();

    expect(clientObject).toEqual({
      name: 'TestMCPError',
      code: 'INPUT_ERROR',
      statusCode: 422,
      message: 'Invalid input',
      details,
      timestamp: expect.any(String),
    });
  });

  it('should maintain instanceof relationship', () => {
    const error = new TestMCPError('Test error');

    expect(error instanceof TestMCPError).toBe(true);
    expect(error instanceof MCPError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should have proper stack trace', () => {
    const error = new TestMCPError('Stack test');

    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
    expect(error.stack).toContain('TestMCPError');
    expect(error.stack).toContain('Stack test');
  });

  it('should handle non-operational errors', () => {
    // Create a test class that allows setting isOperational to false
    class NonOperationalTestError extends MCPError {
      constructor(message: string) {
        super(message, 'NON_OP_ERROR', 500, false);
      }
    }

    const error = new NonOperationalTestError('System failure');
    expect(error.isOperational).toBe(false);
  });
});
