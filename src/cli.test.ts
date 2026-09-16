/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCliRuntime, isCliEntrypoint, reportStartupFailure, resolveLogLevel, runCli } from './cli.js';
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
    const once = vi.spyOn(process, 'once').mockImplementation(() => process);
    const runtime = createCliRuntime();
    const handler = vi.fn();
    runtime.registerSignal('SIGINT', handler);
    expect(runtime.env).toBe(process.env);
    expect(runtime.start).toBeTypeOf('function');
    expect(once).toHaveBeenCalledWith('SIGINT', handler);
    once.mockRestore();
  });

  it('should register idempotent shutdown handlers around a started server', async () => {
    const handlers = new Map<NodeJS.Signals, (signal: NodeJS.Signals) => void>();
    const stop = vi.fn(async () => undefined);
    await runCli({
      env: {},
      start: vi.fn(async () => ({ stop }) as never),
      registerSignal: (signal, handler) => handlers.set(signal, handler),
    });
    handlers.get('SIGINT')?.('SIGINT');
    handlers.get('SIGTERM')?.('SIGTERM');
    expect(stop).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledWith('SIGINT');
  });

  it('should report Error and non-Error startup failures safely', () => {
    const logger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    reportStartupFailure(new Error('failed'), logger);
    reportStartupFailure('unknown', logger);
    expect(logger.error).toHaveBeenNthCalledWith(1, 'Fatal MCP server startup error', { error: 'failed' });
    expect(logger.error).toHaveBeenNthCalledWith(2, 'Fatal MCP server startup error', { error: 'unknown' });
    expect(process.exitCode).toBe(1);
  });
});
