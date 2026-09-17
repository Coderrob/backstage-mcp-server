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

import { BackstageToolName } from '../../shared/constants/backstage-catalog.js';
import { backstageCatalogTools } from './index.js';

describe('Backstage Catalog tool registry', () => {
  it('should exports all tools once in deterministic name order', () => {
    const names = backstageCatalogTools.map(({ name }) => name);
    expect(names).toHaveLength(Object.values(BackstageToolName).length);
    expect(names).toEqual(Object.values(BackstageToolName));
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(names.toSorted());
    expect(Object.isFrozen(backstageCatalogTools)).toBe(true);
  });
});
