/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

/** Structured, redacted context attached to a log record. */
export type LoggerFields = Readonly<Record<string, unknown>>;

/** Minimal logger contract shared by the MCP kernel and application modules. */
export interface Logger {
  debug(message: string, fields?: LoggerFields): void;
  info(message: string, fields?: LoggerFields): void;
  warn(message: string, fields?: LoggerFields): void;
  error(message: string, fields?: LoggerFields): void;
}

/** Extended logger contract used by compatibility and operational modules. */
export interface OperationalLogger extends Logger {
  fatal(message: string, fields?: LoggerFields): void;
  child(bindings: LoggerFields): OperationalLogger;
  createOperationLogger(operation: string, additionalContext?: LoggerFields): OperationalLogger;
}
