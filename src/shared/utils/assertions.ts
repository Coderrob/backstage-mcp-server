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
import { EntityKind, VALID_ENTITY_KINDS } from '../../shared/types/entities.js';
import { isString } from './guards.js';

export function assertNonEmptyString(label: string, value: string): string {
  if (!isString(value) || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

export function assertKind(value: string): EntityKind {
  const kind = assertNonEmptyString('Kind', value) as EntityKind;
  if (!VALID_ENTITY_KINDS.has(kind)) {
    throw new Error('Unknown entity kind');
  }
  return kind;
}
