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

import { z } from 'zod';

import { ValidationError } from '../../shared/utils/custom-errors.js';
import { isObject, isString } from '../../shared/utils/guards.js';
import { logger } from '../../shared/utils/logger.js';
import {
  checkForSQLInjection,
  sanitizeString as sharedSanitizeString,
  validateArray,
  validateWithSchema,
} from '../../shared/utils/validation.js';

export class InputSanitizer {
  private readonly maxStringLength = 10000;
  private readonly maxArrayLength = 1000;
  private readonly allowedCharacters = /^[a-zA-Z0-9\s\-_.@/]+$/;

  /**
   * Sanitizes a string input by validating length and removing dangerous characters.
   * @param input - The string to sanitize
   * @param fieldName - The name of the field being sanitized (for error messages)
   * @returns The sanitized string
   * @throws ValidationError if the input is invalid or too long
   */
  sanitizeString(input: string, fieldName: string): string {
    return sharedSanitizeString(input, fieldName, this.maxStringLength);
  }

  /**
   * Sanitizes an array input by validating length and optionally sanitizing each item.
   * @param input - The array to sanitize
   * @param fieldName - The name of the field being sanitized (for error messages)
   * @param itemSanitizer - Optional function to sanitize each array item
   * @returns The sanitized array
   * @throws ValidationError if the input is not an array or too large
   */
  sanitizeArray<T>(input: T[], fieldName: string, itemSanitizer?: (item: T) => T): T[] {
    validateArray(input, fieldName, this.maxArrayLength);

    if (itemSanitizer) {
      return input.map(itemSanitizer);
    }

    return input;
  }

  /**
   * Sanitizes entity reference input, supporting both string and object formats.
   * @param entityRef - The entity reference to sanitize (string or object format)
   * @returns The sanitized entity reference in the same format as input
   * @throws ValidationError if the entity reference format is invalid
   */
  sanitizeEntityRef(
    entityRef: string | { kind: string; namespace: string; name: string }
  ): string | { kind: string; namespace: string; name: string } {
    if (isString(entityRef)) {
      return this.sanitizeString(entityRef, 'entityRef');
    }

    if (isObject(entityRef)) {
      return {
        kind: this.sanitizeString(entityRef.kind, 'entityRef.kind'),
        namespace: this.sanitizeString(entityRef.namespace, 'entityRef.namespace'),
        name: this.sanitizeString(entityRef.name, 'entityRef.name'),
      };
    }

    throw new ValidationError('Invalid entity reference format');
  }

  /**
   * Validates and sanitizes filter input for entity queries.
   * @param filter - Array of filter objects with key-value pairs
   * @returns Array of sanitized filter objects
   * @throws ValidationError if the filter format is invalid
   */
  sanitizeFilter(filter: Array<{ key: string; values: string[] }>): Array<{ key: string; values: string[] }> {
    return this.sanitizeArray(filter, 'filter', (item) => ({
      key: this.sanitizeString(item.key, 'filter.key'),
      values: this.sanitizeArray(item.values, 'filter.values', (value) => this.sanitizeString(value, 'filter.value')),
    }));
  }

  /**
   * General input validation using Zod schemas.
   * @param data - The data to validate
   * @param schema - The Zod schema to validate against
   * @param fieldName - The name of the field being validated (for error messages)
   * @returns The validated and parsed data
   * @throws ValidationError if the data fails validation
   */
  validateWithSchema<T>(data: unknown, schema: z.ZodSchema<T>, fieldName: string): T {
    return validateWithSchema(data, schema, fieldName);
  }

  /**
   * Checks for SQL injection patterns in input strings.
   * @param input - The string to check for injection patterns
   * @throws ValidationError if dangerous patterns are detected
   */
  checkForInjection(input: string): void {
    checkForSQLInjection(input, 'input');
  }

  /**
   * Sanitizes URL input by validating format and protocol.
   * @param url - The URL string to sanitize
   * @returns The sanitized and validated URL
   * @throws ValidationError if the URL is invalid or uses an unsupported protocol
   */
  sanitizeUrl(url: string): string {
    const sanitized = this.sanitizeString(url, 'url');

    try {
      const parsedUrl = new URL(sanitized);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new ValidationError('Invalid URL protocol');
      }
      return parsedUrl.toString();
    } catch {
      logger.error('URL validation failed', { url });
      throw new ValidationError('Invalid URL format');
    }
  }
}

// Global input sanitizer instance

export const inputSanitizer = new InputSanitizer();
