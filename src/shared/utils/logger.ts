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
import { Bindings, Logger, LoggerOptions, pino, stdTimeFunctions } from 'pino';

import { ILogger } from '../../shared/types/logger.js';
import { isString } from './guards.js';

// Ensure Node.js globals are available
declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
};

class PinoLogger implements ILogger {
  private logger: Logger;

  /**
   * Creates a new PinoLogger instance with optional configuration.
   * Automatically detects Jest environment for pretty printing.
   * @param options - Optional Pino logger configuration options
   */
  constructor(options: LoggerOptions = {}) {
    // Detect if we're running in Jest for pretty printing
    const isJest =
      isString(process.env.JEST_WORKER_ID) ||
      process.env.NODE_ENV === 'test' ||
      process.argv.some((arg: string) => arg.includes('jest'));

    this.logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      formatters: {
        level: (label: string) => ({ level: label }),
      },
      timestamp: stdTimeFunctions.isoTime,
      // Use pretty printing in Jest environment for better readability
      ...(isJest
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
          }
        : {}),
      ...options,
    });
  }

  /**
   * Logs a debug message.
   * @param message - The message to log
   * @param args - Additional arguments to include in the log
   */
  debug(message: string, ...args: unknown[]): void {
    // @ts-expect-error - pino accepts various argument types
    this.logger.debug(message, ...args);
  }

  /**
   * Logs an info message.
   * @param message - The message to log
   * @param args - Additional arguments to include in the log
   */
  info(message: string, ...args: unknown[]): void {
    // @ts-expect-error - pino accepts various argument types
    this.logger.info(message, ...args);
  }

  /**
   * Logs a warning message.
   * @param message - The message to log
   * @param args - Additional arguments to include in the log
   */
  warn(message: string, ...args: unknown[]): void {
    // @ts-expect-error - pino accepts various argument types
    this.logger.warn(message, ...args);
  }

  /**
   * Logs an error message.
   * @param message - The message to log
   * @param args - Additional arguments to include in the log
   */
  error(message: string, ...args: unknown[]): void {
    // @ts-expect-error - pino accepts various argument types
    this.logger.error(message, ...args);
  }

  /**
   * Logs a fatal error message.
   * @param message - The message to log
   * @param args - Additional arguments to include in the log
   */
  fatal(message: string, ...args: unknown[]): void {
    // @ts-expect-error - pino accepts various argument types
    this.logger.fatal(message, ...args);
  }

  /**
   * Creates a child logger with additional bindings.
   * @param bindings - Additional context to include in all log messages from the child logger
   * @returns A new logger instance with the additional bindings
   */
  child(bindings: Bindings): ILogger {
    const childLogger = this.logger.child(bindings);
    const wrapper: ILogger = {
      // @ts-expect-error - pino accepts various argument types
      debug: (m: string, ...a: unknown[]) => childLogger.debug(m, ...a),
      // @ts-expect-error - pino accepts various argument types
      info: (m: string, ...a: unknown[]) => childLogger.info(m, ...a),
      // @ts-expect-error - pino accepts various argument types
      warn: (m: string, ...a: unknown[]) => childLogger.warn(m, ...a),
      // @ts-expect-error - pino accepts various argument types
      error: (m: string, ...a: unknown[]) => childLogger.error(m, ...a),
      // @ts-expect-error - pino accepts various argument types
      fatal: (m: string, ...a: unknown[]) => childLogger.fatal(m, ...a),
    };
    return wrapper;
  }
}

// Default logger instance
export const logger = new PinoLogger();
