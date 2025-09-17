/* eslint-disable import/no-unused-modules */

/**
 * Base error class for MCP Server with standardized error handling
 */
export abstract class MCPError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts error to a structured log object
   */
  toLogObject(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Converts error to a client-safe object (without sensitive information)
   */
  toClientObject(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...(this.details && { details: this.sanitizeDetails(this.details) }),
    };
  }

  /**
   * Sanitizes details object for client consumption
   */
  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(details)) {
      // Remove sensitive fields
      if (!['password', 'token', 'secret', 'key'].includes(key.toLowerCase())) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

/**
 * Authentication error for auth failures
 */
export class AuthenticationError extends MCPError {
  constructor(message: string = 'Authentication required', details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, details);
  }
}

/**
 * Authorization error for permission failures
 */
export class AuthorizationError extends MCPError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, details);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends MCPError {
  constructor(resource: string, details?: Record<string, unknown>) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, true, details);
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', 409, true, details);
  }
}

/**
 * Rate limit error for rate limiting
 */
export class RateLimitError extends MCPError {
  constructor(message: string, retryAfter?: number, details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, {
      retryAfter,
      ...details,
    });
  }
}

/**
 * Network error for external service failures
 */
export class NetworkError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 502, true, details);
  }
}

/**
 * Backstage API error for Backstage service failures
 */
export class BackstageAPIError extends MCPError {
  constructor(message: string, statusCode: number = 502, details?: Record<string, unknown>) {
    super(message, 'BACKSTAGE_API_ERROR', statusCode, true, details);
  }
}

/**
 * Configuration error for configuration issues
 */
export class ConfigurationError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 500, false, details);
  }
}

/**
 * Internal server error for unexpected failures
 */
export class InternalServerError extends MCPError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, false, details);
  }
}

/**
 * Tool execution error for tool-specific failures
 */
export class ToolExecutionError extends MCPError {
  constructor(toolName: string, operation: string, originalError?: Error, details?: Record<string, unknown>) {
    super(`Tool execution failed: ${toolName}.${operation}`, 'TOOL_EXECUTION_ERROR', 500, true, {
      tool: toolName,
      operation,
      originalError: originalError?.message,
      ...details,
    });
  }
}

/**
 * Timeout error for operation timeouts
 */
export class TimeoutError extends MCPError {
  constructor(operation: string, timeoutMs: number, details?: Record<string, unknown>) {
    super(`Operation timed out: ${operation}`, 'TIMEOUT_ERROR', 408, true, {
      operation,
      timeoutMs,
      ...details,
    });
  }
}
