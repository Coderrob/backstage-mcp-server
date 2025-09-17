import {
  AuthenticationError,
  AuthorizationError,
  BackstageAPIError,
  ConfigurationError,
  ConflictError,
  InternalServerError,
  MCPError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  ToolExecutionError,
  ValidationError,
} from './custom-errors.js';

describe('Custom Errors', () => {
  describe('ValidationError', () => {
    it('should create ValidationError with message', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });

    it('should inherit from MCPError', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('AuthenticationError', () => {
    it('should create AuthenticationError with message', () => {
      const error = new AuthenticationError('Authentication failed');
      expect(error.message).toBe('Authentication failed');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should inherit from MCPError', () => {
      const error = new AuthenticationError('Authentication failed');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('AuthorizationError', () => {
    it('should create AuthorizationError with message', () => {
      const error = new AuthorizationError('Access denied');
      expect(error.message).toBe('Access denied');
      expect(error.name).toBe('AuthorizationError');
    });

    it('should inherit from MCPError', () => {
      const error = new AuthorizationError('Access denied');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with resource', () => {
      const error = new NotFoundError('Resource');
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.statusCode).toBe(404);
    });

    it('should inherit from MCPError', () => {
      const error = new NotFoundError('Resource');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with message', () => {
      const error = new ConflictError('Resource conflict');
      expect(error.message).toBe('Resource conflict');
      expect(error.name).toBe('ConflictError');
    });

    it('should inherit from MCPError', () => {
      const error = new ConflictError('Resource conflict');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('RateLimitError', () => {
    it('should create RateLimitError with message', () => {
      const error = new RateLimitError('Rate limit exceeded');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.name).toBe('RateLimitError');
    });

    it('should inherit from MCPError', () => {
      const error = new RateLimitError('Rate limit exceeded');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('NetworkError', () => {
    it('should create NetworkError with message', () => {
      const error = new NetworkError('Network failure');
      expect(error.message).toBe('Network failure');
      expect(error.name).toBe('NetworkError');
    });

    it('should inherit from MCPError', () => {
      const error = new NetworkError('Network failure');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('BackstageAPIError', () => {
    it('should create BackstageAPIError with message', () => {
      const error = new BackstageAPIError('API error');
      expect(error.message).toBe('API error');
      expect(error.name).toBe('BackstageAPIError');
    });

    it('should inherit from MCPError', () => {
      const error = new BackstageAPIError('API error');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('ConfigurationError', () => {
    it('should create ConfigurationError with message', () => {
      const error = new ConfigurationError('Configuration error');
      expect(error.message).toBe('Configuration error');
      expect(error.name).toBe('ConfigurationError');
    });

    it('should inherit from MCPError', () => {
      const error = new ConfigurationError('Configuration error');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('InternalServerError', () => {
    it('should create InternalServerError with message', () => {
      const error = new InternalServerError('Internal error');
      expect(error.message).toBe('Internal error');
      expect(error.name).toBe('InternalServerError');
    });

    it('should inherit from MCPError', () => {
      const error = new InternalServerError('Internal error');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('ToolExecutionError', () => {
    it('should create ToolExecutionError with tool and operation', () => {
      const error = new ToolExecutionError('testTool', 'execute');
      expect(error.message).toBe('Tool execution failed: testTool.execute');
      expect(error.name).toBe('ToolExecutionError');
      expect(error.code).toBe('TOOL_EXECUTION_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('should inherit from MCPError', () => {
      const error = new ToolExecutionError('testTool', 'execute');
      expect(error).toBeInstanceOf(MCPError);
    });
  });

  describe('TimeoutError', () => {
    it('should create TimeoutError with operation and timeout', () => {
      const error = new TimeoutError('testOperation', 5000);
      expect(error.message).toBe('Operation timed out: testOperation');
      expect(error.name).toBe('TimeoutError');
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.statusCode).toBe(408);
    });

    it('should inherit from MCPError', () => {
      const error = new TimeoutError('testOperation', 5000);
      expect(error).toBeInstanceOf(MCPError);
    });
  });
});
