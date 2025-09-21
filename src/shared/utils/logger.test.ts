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

import { logger } from './logger.js';

describe('logger', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should have info method', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('should have error method', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('should have debug method', () => {
    expect(typeof logger.debug).toBe('function');
  });

  it('should have warn method', () => {
    expect(typeof logger.warn).toBe('function');
  });
});
