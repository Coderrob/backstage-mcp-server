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

import { describe, expect, it } from 'vitest';

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

    expect(typeof stderrLogger.debug).toBe('function');
    expect(typeof stderrLogger.info).toBe('function');
    expect(typeof stderrLogger.warn).toBe('function');
    expect(typeof stderrLogger.error).toBe('function');
    expect(typeof noopLogger.debug).toBe('function');
    expect(typeof noopLogger.info).toBe('function');
    expect(typeof noopLogger.warn).toBe('function');
    expect(typeof noopLogger.error).toBe('function');
    noopLogger.debug('debug');
    noopLogger.info('info');
    noopLogger.warn('warn');
    noopLogger.error('error');
    stderrLogger.debug('filtered');
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
