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

jest.mock('./application/server/server.js', () => ({
  startServer: mockStartServer,
}));

jest.mock('./shared/utils/logger.js', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

jest.mock('./shared/utils/index.js', () => ({
  isError: mockIsError,
}));

describe('src/index main IIFE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BACKSTAGE_BASE_URL = 'http://localhost:3000';
    process.env.BACKSTAGE_TOKEN = 'mock-token';
  });

  afterEach(() => {
    jest.resetModules(); // ensure fresh module import for each test
    delete process.env.BACKSTAGE_BASE_URL;
    delete process.env.BACKSTAGE_TOKEN;
  });

  it('starts the server successfully and does not log errors', async () => {
    mockStartServer.mockResolvedValueOnce(undefined);

    // Importing the ESM module triggers the IIFE
    await import('./index.js');

    expect(mockStartServer).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledTimes(0);
  });
});
