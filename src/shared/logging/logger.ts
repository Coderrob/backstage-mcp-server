/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { randomUUID } from 'node:crypto';

import { destination, type Logger as PinoLoggerInstance, type LoggerOptions, pino, stdTimeFunctions } from 'pino';

import type { Logger, LoggerFields, OperationalLogger } from '../../types/logging.js';

export type { Logger, OperationalLogger } from '../../types/logging.js';

const STDERR_FILE_DESCRIPTOR = 2;
const SENSITIVE_KEY = /(authorization|cookie|password|secret|token|api[-_]?key)/i;
const CIRCULAR_VALUE = '[Circular]';
const DEFAULT_SERVICE_NAME = 'backstage-mcp-server';
const OPERATION_ID_PREFIX = 'op_';
const REDACTED_VALUE = '[REDACTED]';

/** Supported severity levels for repository logging. */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/** Logger that intentionally discards every record. */
export const noopLogger: Logger = Object.freeze({
  /**
   * Discards a debug record.
   * @returns No value.
   */
  debug: () => undefined,
  /**
   * Discards an informational record.
   * @returns No value.
   */
  info: () => undefined,
  /**
   * Discards a warning record.
   * @returns No value.
   */
  warn: () => undefined,
  /**
   * Discards an error record.
   * @returns No value.
   */
  error: () => undefined,
});

/** Pino-backed implementation shared by protocol and operational code. */
class StructuredLogger implements OperationalLogger {
  private readonly instance: PinoLoggerInstance;

  /**
   * Creates a structured logger whose destination is always stderr.
   * @param options - Pino configuration, including the minimum severity.
   * @param instance - Existing child instance used internally by `child`.
   */
  constructor(options: Readonly<LoggerOptions> = {}, instance?: Readonly<PinoLoggerInstance>) {
    this.instance =
      instance ??
      pino(
        {
          level: LogLevel.INFO,
          formatters: {
            /**
             * Emits readable severity names instead of numeric Pino levels.
             * @param label - Pino severity label.
             * @returns A structured severity field.
             */
            level: (label: string): { level: string } => ({ level: label }),
          },
          timestamp: stdTimeFunctions.isoTime,
          ...options,
        },
        destination({ dest: STDERR_FILE_DESCRIPTOR, sync: false })
      );
  }

  /**
   * Writes a debug record.
   * @param message - Human-readable event description.
   * @param fields - Optional structured context.
   */
  debug(message: string, fields?: Readonly<LoggerFields>): void {
    this.instance.debug(sanitizeFields(fields), message);
  }

  /**
   * Writes an informational record.
   * @param message - Human-readable event description.
   * @param fields - Optional structured context.
   */
  info(message: string, fields?: Readonly<LoggerFields>): void {
    this.instance.info(sanitizeFields(fields), message);
  }

  /**
   * Writes a warning record.
   * @param message - Human-readable event description.
   * @param fields - Optional structured context.
   */
  warn(message: string, fields?: Readonly<LoggerFields>): void {
    this.instance.warn(sanitizeFields(fields), message);
  }

  /**
   * Writes an error record.
   * @param message - Human-readable event description.
   * @param fields - Optional structured context.
   */
  error(message: string, fields?: Readonly<LoggerFields>): void {
    this.instance.error(sanitizeFields(fields), message);
  }

  /**
   * Writes a fatal record.
   * @param message - Human-readable event description.
   * @param fields - Optional structured context.
   */
  fatal(message: string, fields?: Readonly<LoggerFields>): void {
    this.instance.fatal(sanitizeFields(fields), message);
  }

  /**
   * Creates a logger that includes fixed structured context.
   * @param bindings - Context included with every child record.
   * @returns A child operational logger.
   */
  child(bindings: Readonly<LoggerFields>): OperationalLogger {
    return new StructuredLogger({}, this.instance.child(sanitizeFields(bindings)));
  }

  /**
   * Creates a logger scoped to one named operation and correlation identifier.
   * @param operation - Operation represented by subsequent records.
   * @param additionalContext - Additional fixed structured context.
   * @returns An operation-scoped logger.
   */
  createOperationLogger(operation: string, additionalContext: Readonly<LoggerFields> = {}): OperationalLogger {
    return this.child({
      operation,
      correlationId: `${OPERATION_ID_PREFIX}${randomUUID()}`,
      service: DEFAULT_SERVICE_NAME,
      ...additionalContext,
    });
  }
}

/**
 * Creates the default protocol-safe structured logger.
 * @param minimumLevel - Minimum severity written to stderr.
 * @returns A redacting logger that never writes to the stdio protocol channel.
 */
export function createStderrLogger(minimumLevel: Readonly<LogLevel> = LogLevel.INFO): Logger {
  return new StructuredLogger({ level: minimumLevel });
}

/**
 * Recursively redacts credentials and handles circular structured values.
 * @param value - Value to sanitize before logging.
 * @param seen - Object identities already visited during recursion.
 * @returns A safe copy suitable for structured logging.
 */
export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return CIRCULAR_VALUE;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map(/** Redacts one array item. */ (item) => redact(item, seen));
  }
  return Object.fromEntries(
    Object.entries(value).map(
      /** Redacts one structured field. */ ([key, nested]) => [
        key,
        SENSITIVE_KEY.test(key) ? REDACTED_VALUE : redact(nested, seen),
      ]
    )
  );
}

/**
 * Converts optional fields into the plain object expected by Pino.
 * @param fields - Structured context supplied by a caller.
 * @returns Redacted structured fields.
 */
function sanitizeFields(fields?: Readonly<LoggerFields>): Record<string, unknown> {
  if (!fields) return {};
  const sanitized = redact(fields);
  return typeof sanitized === 'object' && sanitized !== null && !Array.isArray(sanitized)
    ? Object.fromEntries(Object.entries(sanitized))
    : {};
}

/** Shared operational logger for compatibility modules without dependency injection. */
export const logger: OperationalLogger = new StructuredLogger();
