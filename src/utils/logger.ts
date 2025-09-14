import pino from 'pino';

export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  fatal(message: string, ...args: any[]): void;
}

export class PinoLogger implements ILogger {
  private logger: pino.Logger;

  constructor(options: pino.LoggerOptions = {}) {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label: string) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...options,
    });
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.logger.error(message, ...args);
  }

  fatal(message: string, ...args: any[]): void {
    this.logger.fatal(message, ...args);
  }

  child(bindings: pino.Bindings): ILogger {
    return new PinoLogger({ ...this.logger, ...bindings });
  }
}

// Default logger instance
export const logger = new PinoLogger();
