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

import { getLocationByEntityTool } from './get_location_by_entity.tool.js';

describe('get_location_by_entity tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getLocationByEntityTool).toMatchObject({ kind: 'tool', name: 'get_location_by_entity' });
    expect(getLocationByEntityTool.inputSchema.safeParse({ entityRef: 'component:default/api' }).success).toBe(true);
    expect(getLocationByEntityTool.description.length).toBeGreaterThan(0);
  });
});
