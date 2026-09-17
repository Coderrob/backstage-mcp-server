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

import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CliShutdownSignal,
  createCliRuntime,
  isCliEntrypoint,
  reportStartupFailure,
  resolveLogLevel,
  runCli,
} from './cli.js';
import type { Logger } from './shared/logging/logger.js';
import { LogLevel } from './shared/logging/logger.js';

const originalExitCode = process.exitCode;

afterEach(() => {
  process.exitCode = originalExitCode;
});

describe('CLI lifecycle', () => {
  it('should resolve supported log levels and entrypoint paths', () => {
    expect(resolveLogLevel({ LOG_LEVEL: 'debug' })).toBe(LogLevel.DEBUG);
    expect(resolveLogLevel({ LOG_LEVEL: 'trace' })).toBe(LogLevel.INFO);
    expect(isCliEntrypoint(import.meta.url, fileURLToPath(import.meta.url))).toBe(true);
    expect(isCliEntrypoint(import.meta.url, undefined)).toBe(false);
    expect(isCliEntrypoint(import.meta.url, fileURLToPath(pathToFileURL('different.js')))).toBe(false);
  });

  it('should create production process bindings', () => {
    const once = vi.spyOn(process, 'once').mockImplementationOnce(() => process);
    const runtime = createCliRuntime();
    const handler = vi.fn();
    runtime.registerSignal(CliShutdownSignal.INTERRUPT, handler);
    expect(runtime.env).toBe(process.env);
    expect(typeof runtime.start).toBe('function');
    expect(once).toHaveBeenCalledWith(CliShutdownSignal.INTERRUPT, handler);
    once.mockRestore();
  });

  it('should register idempotent shutdown handlers around a started server', async () => {
    const handlers = new Map<NodeJS.Signals, (signal: NodeJS.Signals) => void>();
    const stop = vi.fn(async () => undefined);
    await runCli({
      env: {},
      start: vi.fn(async () => ({ stop })),
      registerSignal: (signal, handler) => handlers.set(signal, handler),
    });
    handlers.get(CliShutdownSignal.INTERRUPT)?.(CliShutdownSignal.INTERRUPT);
    handlers.get(CliShutdownSignal.TERMINATE)?.(CliShutdownSignal.TERMINATE);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledWith(CliShutdownSignal.INTERRUPT);
  });

  it('should report Error and non-Error startup failures safely', () => {
    const error = vi.fn();
    const logger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error };
    reportStartupFailure(new Error('failed'), logger);
    reportStartupFailure('unknown', logger);
    expect(error).toHaveBeenNthCalledWith(1, 'Fatal MCP server startup error', { error: 'failed' });
    expect(error).toHaveBeenNthCalledWith(2, 'Fatal MCP server startup error', { error: 'unknown' });
    expect(process.exitCode).toBe(1);
  });
});
