/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

/** Stable machine-readable error codes emitted by the MCP harness. */
export enum McpErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  TIMEOUT = 'TIMEOUT',
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  INVALID_LIFECYCLE = 'INVALID_LIFECYCLE',
}

/** Base error carrying a stable MCP harness error code and safe details. */
export class McpHarnessError extends Error {
  /**
   * Creates an error raised by the generic MCP harness.
   * @param code - Stable machine-readable failure code.
   * @param message - Human-readable failure description.
   * @param details - Structured diagnostic context for the failure.
   * @param options - Standard JavaScript error construction options.
   */
  constructor(
    readonly code: McpErrorCode,
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
    options?: Readonly<ErrorOptions>
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** Reports invalid input received by an MCP feature. */
export class McpInputError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param message - The message.
   * @param details - The details.
   */
  constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super(McpErrorCode.INVALID_INPUT, message, details);
  }
}

/** Reports output that does not satisfy a feature's declared schema. */
export class McpOutputError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param options - The configuration options.
   */
  constructor(options?: Readonly<ErrorOptions>) {
    super(McpErrorCode.INTERNAL_ERROR, 'Tool returned invalid structured output', undefined, options);
  }
}

/** Reports that a request requires an authenticated principal. */
export class McpAuthenticationError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param message - The message.
   */
  constructor(message = 'Authentication is required') {
    super(McpErrorCode.AUTHENTICATION_REQUIRED, message);
  }
}

/** Reports that a principal lacks one or more required scopes. */
export class McpAuthorizationError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param requiredScopes - The required scopes.
   */
  constructor(requiredScopes: readonly string[]) {
    super(McpErrorCode.INSUFFICIENT_PERMISSIONS, 'The caller does not have the required scopes', { requiredScopes });
  }
}

/** Reports that a requested MCP or upstream resource does not exist. */
export class McpNotFoundError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param resource - The resource.
   * @param reference - The reference.
   */
  constructor(resource: string, reference?: string) {
    super(McpErrorCode.NOT_FOUND, `${resource} was not found`, reference ? { reference } : undefined);
  }
}

/** Reports that an invocation exceeded its configured request allowance. */
export class McpRateLimitError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param retryAfterMs - The retry after ms.
   */
  constructor(retryAfterMs: number) {
    super(McpErrorCode.RATE_LIMITED, 'Rate limit exceeded', { retryAfterMs });
  }
}

/** Reports that an invocation exceeded its configured timeout. */
export class McpTimeoutError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param timeoutMs - The timeout ms.
   */
  constructor(timeoutMs: number) {
    super(McpErrorCode.TIMEOUT, `Operation timed out after ${String(timeoutMs)}ms`, { timeoutMs });
  }
}

/** Reports a sanitized failure returned by an upstream service. */
export class McpUpstreamError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param message - The message.
   * @param options - The configuration options.
   */
  constructor(message: string, options?: Readonly<ErrorOptions>) {
    super(McpErrorCode.UPSTREAM_ERROR, message, undefined, options);
  }
}

/** Reports invalid harness, plugin, or feature configuration. */
export class McpConfigurationError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param message - The message.
   * @param details - The details.
   */
  constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super(McpErrorCode.INVALID_CONFIGURATION, message, details);
  }
}

/** Reports an operation that is invalid for the application's current state. */
export class McpLifecycleError extends McpHarnessError {
  /**
   * Creates a new application instance.
   * @param message - The message.
   */
  constructor(message: string) {
    super(McpErrorCode.INVALID_LIFECYCLE, message);
  }
}
