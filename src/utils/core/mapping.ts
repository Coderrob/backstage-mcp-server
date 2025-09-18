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
import { ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

/**
 * Converts a ZodType into a ZodRawShape if possible.
 * @param schema - The ZodType to attempt to convert.
 * @returns A ZodRawShape if the schema is a ZodObject, otherwise throws an error.
 */
export function toZodRawShape<T extends ZodTypeAny>(schema: T): ZodRawShape {
  if (schema instanceof ZodObject) {
    return schema.shape;
  }
  throw new TypeError('Provided schema is not a ZodObject and cannot be converted to a ZodRawShape.');
}
