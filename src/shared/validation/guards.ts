/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

/**
 * Reports whether a value is a non-empty string.
 * @param value - Value to inspect.
 * @returns Whether the value is a string containing at least one character.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
