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
import { jest } from '@jest/globals';

// Create typed mocks so mockResolvedValueOnce / mockRejectedValueOnce accept values.
const mockStartServer = jest.fn() as jest.MockedFunction<() => Promise<void>>;
const mockLoggerError = jest.fn() as jest.MockedFunction<(msg: string, meta?: unknown) => void>;
const mockIsError = jest.fn() as jest.MockedFunction<(e: unknown) => boolean>;

jest.unstable_mockModule('./server.js', () => ({
  startServer: mockStartServer,
}));

jest.unstable_mockModule('./utils/core/logger.js', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

jest.unstable_mockModule('./utils/index.js', () => ({
  isError: mockIsError,
}));

describe('src/index main IIFE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules(); // ensure fresh module import for each test
  });

  it('starts the server successfully and does not log errors', async () => {
    mockStartServer.mockResolvedValueOnce(undefined);

    // Importing the ESM module triggers the IIFE
    await import('./index.js');

    expect(mockStartServer).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledTimes(0);
  });

  it('logs an Error object message and exits with code 1', async () => {
    const error = new Error('boom');
    mockStartServer.mockRejectedValueOnce(error);
    mockIsError.mockReturnValueOnce(true);

    // Spy on process.exit to prevent the test runner from exiting
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Importing the module should complete; exitSpy will have been called from the catch handler
    await import('./index.js');

    expect(mockStartServer).toHaveBeenCalledTimes(1);
    expect(mockIsError).toHaveBeenCalledWith(error);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith('Fatal server startup error', {
      error: error.message,
    });
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('logs a non-Error object and exits with code 1', async () => {
    const err = 'oh no';
    mockStartServer.mockRejectedValueOnce(err);
    mockIsError.mockReturnValueOnce(false);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await import('./index.js');

    expect(mockStartServer).toHaveBeenCalledTimes(1);
    expect(mockIsError).toHaveBeenCalledWith(err);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith('Fatal server startup error', {
      error: String(err),
    });
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
