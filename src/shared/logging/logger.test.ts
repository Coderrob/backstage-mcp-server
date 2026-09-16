/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { describe, expect, it } from 'vitest';

import type { LoggerFields } from './logger.js';
import { createStderrLogger, logger, LogLevel, noopLogger, redact } from './logger.js';

describe('shared logger', () => {
  it('should recursively redact credentials and represent cycles safely', () => {
    const cyclic: Record<string, unknown> = { name: 'request' };
    cyclic['self'] = cyclic;

    expect(
      redact({
        authorization: 'Bearer secret',
        nested: [{ apiKey: 'secret-key', safe: 'visible' }],
        cyclic,
      })
    ).toEqual({
      authorization: '[REDACTED]',
      nested: [{ apiKey: '[REDACTED]', safe: 'visible' }],
      cyclic: { name: 'request', self: '[Circular]' },
    });
  });

  it('should expose interchangeable injected and stderr logger contracts', () => {
    const stderrLogger = createStderrLogger(LogLevel.ERROR);

    expect(stderrLogger).toMatchObject({
      debug: expect.any(Function),
      info: expect.any(Function),
      warn: expect.any(Function),
      error: expect.any(Function),
    });
    expect(noopLogger).toMatchObject({
      debug: expect.any(Function),
      info: expect.any(Function),
      warn: expect.any(Function),
      error: expect.any(Function),
    });
    noopLogger.debug('debug');
    noopLogger.info('info');
    noopLogger.warn('warn');
    noopLogger.error('error');
    stderrLogger.debug('filtered');
    stderrLogger.info('invalid fields', [] as unknown as LoggerFields);
  });

  it('should write every operational severity and create scoped children', () => {
    logger.debug('debug', { token: 'hidden' });
    logger.info('info');
    logger.warn('warn', { value: 1 });
    logger.error('error', { value: 2 });
    logger.fatal('fatal', { value: 3 });
    const child = logger.child({ component: 'test' });
    child.info('child');
    logger.createOperationLogger('coverage', { entity: 'component:default/api' }).info('operation');
    expect(redact('plain')).toBe('plain');
    expect(redact(null)).toBeNull();
  });
});
