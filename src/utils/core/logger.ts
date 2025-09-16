import { Bindings, Logger, LoggerOptions, pino, stdTimeFunctions } from 'pino';

import { ILogger } from '../../types/index.js';
import { isString } from './guards.js';

// Ensure Node.js globals are available
declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
};

class PinoLogger implements ILogger {
  private logger: Logger;

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

  debug(message: string, ...args: unknown[]): void {
    // pino's log methods accept any[]; narrow with a cast. Disable rule for this line.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.logger.debug(message, ...(args as any[]));
  }

  info(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.logger.info(message, ...(args as any[]));
  }

  warn(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.logger.warn(message, ...(args as any[]));
  }

  error(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.logger.error(message, ...(args as any[]));
  }

  fatal(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.logger.fatal(message, ...(args as any[]));
  }

  child(bindings: Bindings): ILogger {
    const childLogger = this.logger.child(bindings);
    const wrapper: ILogger = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      debug: (m: string, ...a: unknown[]) => childLogger.debug(m, ...(a as any[])),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      info: (m: string, ...a: unknown[]) => childLogger.info(m, ...(a as any[])),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      warn: (m: string, ...a: unknown[]) => childLogger.warn(m, ...(a as any[])),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (m: string, ...a: unknown[]) => childLogger.error(m, ...(a as any[])),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fatal: (m: string, ...a: unknown[]) => childLogger.fatal(m, ...(a as any[])),
    };
    return wrapper;
  }
}

// Default logger instance
export const logger = new PinoLogger();
