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

import { generateManifest } from './generate-manifest.js';
import { logger } from './utils/core/logger.js';

// Mock dependencies
jest.mock('./utils/core/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Spy on logger methods
jest.spyOn(logger, 'info');
jest.spyOn(logger, 'error');

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('generateManifest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate manifest successfully', async () => {
    await generateManifest();

    expect(mockLogger.info).toHaveBeenCalledWith('Tools manifest generated successfully!');
  });

  it('should handle errors gracefully', async () => {
    // The function should complete without throwing
    await expect(generateManifest()).resolves.not.toThrow();
  });
});
