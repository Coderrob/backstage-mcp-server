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

import { getLocationByRefTool } from './get_location_by_ref.tool.js';

describe('get_location_by_ref tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getLocationByRefTool).toMatchObject({ kind: 'tool', name: 'get_location_by_ref' });
    expect(
      getLocationByRefTool.inputSchema.safeParse({ locationRef: 'url:https://example.test/catalog-info.yaml' }).success
    ).toBe(true);
    expect(getLocationByRefTool.description.length).toBeGreaterThan(0);
  });
});
