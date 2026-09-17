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

import { getEntitiesByQueryTool } from './get_entities_by_query.tool.js';

describe('get_entities_by_query tool', () => {
  it('should declares a valid typed MCP contract', () => {
    expect(getEntitiesByQueryTool).toMatchObject({ kind: 'tool', name: 'get_entities_by_query' });
    expect(getEntitiesByQueryTool.inputSchema.safeParse({ order: { field: 'metadata.name' } }).success).toBe(true);
    expect(getEntitiesByQueryTool.description.length).toBeGreaterThan(0);
  });
});
