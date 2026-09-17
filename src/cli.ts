#!/usr/bin/env node
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

import { pathToFileURL } from 'node:url';

import { startServer } from './server.js';
import { BackstageEnvironmentVariable } from './shared/constants/backstage-catalog.js';
import { createStderrLogger, type Logger, LogLevel } from './shared/logging/logger.js';
import type { CliRuntime } from './types/cli.js';

export type { CliRuntime } from './types/cli.js';

/** Process signals that trigger graceful MCP server shutdown. */
export enum CliShutdownSignal {
  INTERRUPT = 'SIGINT',
  TERMINATE = 'SIGTERM',
}

/**
 * Creates the production process bindings used by the executable entrypoint.
 * @returns CLI dependencies backed by the current Node.js process.
 */
export function createCliRuntime(): CliRuntime {
  return {
    env: process.env,
    start: startServer,
    /**
     * Registers one process signal handler.
     * @param signal - Node.js signal to observe.
     * @param handler - Callback invoked once for the signal.
     */
    registerSignal(signal, handler): void {
      process.once(signal, handler);
    },
  };
}

/**
 * Reports whether this module is the process entrypoint.
 * @param moduleUrl - Current module URL.
 * @param executablePath - Script path supplied by Node.js.
 * @returns Whether the module should start the CLI automatically.
 */
export function isCliEntrypoint(moduleUrl: string, executablePath: string | undefined): boolean {
  return executablePath !== undefined && moduleUrl === pathToFileURL(executablePath).href;
}

/**
 * Reports a startup failure without writing to the MCP stdout channel.
 * @param error - Failure raised during CLI startup.
 * @param logger - Structured stderr logger.
 */
export function reportStartupFailure(error: unknown, logger: Readonly<Logger>): void {
  logger.error('Fatal MCP server startup error', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}

/**
 * Resolves the supported log level from process configuration.
 * @param env - Process environment containing the optional log level.
 * @returns Debug when explicitly requested, otherwise info.
 */
export function resolveLogLevel(env: Readonly<NodeJS.ProcessEnv>): LogLevel {
  return env[BackstageEnvironmentVariable.LOG_LEVEL] === LogLevel.DEBUG ? LogLevel.DEBUG : LogLevel.INFO;
}

/**
 * Starts the stdio server and installs idempotent signal shutdown handlers.
 * @param runtime - Injectable process and application dependencies.
 */
export async function runCli(runtime: Readonly<CliRuntime> = createCliRuntime()): Promise<void> {
  const logger = createStderrLogger(resolveLogLevel(runtime.env));
  const app = await runtime.start({ logger });
  let stopping = false;

  /**
   * Stops the application once for either supported process signal.
   * @param signal - Process signal that initiated shutdown.
   */
  const stop = (signal: Readonly<NodeJS.Signals>): void => {
    if (stopping) return;
    stopping = true;
    void app.stop(signal);
  };
  runtime.registerSignal(CliShutdownSignal.INTERRUPT, stop);
  runtime.registerSignal(CliShutdownSignal.TERMINATE, stop);
}

/* v8 ignore start -- exercised by the packaged stdio and MCP Inspector process tests. */
if (isCliEntrypoint(import.meta.url, process.argv[1])) {
  void runCli().catch(
    /** Reports a failure that escapes automatic CLI startup. */ (error: unknown) => {
      reportStartupFailure(error, createStderrLogger(resolveLogLevel(process.env)));
    }
  );
}
/* v8 ignore stop */
