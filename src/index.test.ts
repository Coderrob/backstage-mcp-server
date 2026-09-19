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

import * as packageApi from './index.js';

describe('package API', () => {
  it('should expose server, harness, Backstage, and logging APIs without starting a process', () => {
    expect(typeof packageApi.createBackstageServer).toBe('function');
    expect(typeof packageApi.createMcpServer).toBe('function');
    expect(typeof packageApi.backstageCatalogPlugin).toBe('object');
    expect(typeof packageApi.generateManifest).toBe('function');
    expect(typeof packageApi.createStderrLogger).toBe('function');
    expect(typeof packageApi.McpErrorCode).toBe('object');
    expect(typeof packageApi.LogLevel).toBe('object');
    expect(packageApi.BackstageEntityKind.API).toBe('API');
  });
});
