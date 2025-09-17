import { z } from 'zod';

import { isObject, isString } from '../utils/core/guards.js';
import { logger } from '../utils/core/logger.js';
import { ValidationError } from '../utils/errors/custom-errors.js';

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
    this.validateStringInput(input, fieldName);
    this.validateStringLength(input, fieldName);

    const sanitized = this.removeDangerousCharacters(input);
    this.checkForDangerousPatterns(sanitized, fieldName);

    return sanitized.trim();
  }

  /**
   * Validates that the input is a string.
   * @param input - The input to validate
   * @param fieldName - The field name for error messages
   * @throws ValidationError if the input is not a string
   * @private
   */
  private validateStringInput(input: unknown, fieldName: string): asserts input is string {
    if (!isString(input)) {
      throw new ValidationError(`Invalid input type for ${fieldName}: expected string, got ${typeof input}`);
    }
  }

  /**
   * Validates that the string length is within acceptable limits.
   * @param input - The string to validate
   * @param fieldName - The field name for error messages
   * @throws ValidationError if the string is too long
   * @private
   */
  private validateStringLength(input: string, fieldName: string): void {
    if (input.length > this.maxStringLength) {
      throw new ValidationError(
        `Input too long for ${fieldName}: ${input.length} characters (max: ${this.maxStringLength})`
      );
    }
  }

  /**
   * Removes dangerous characters from a string.
   * @param input - The string to clean
   * @returns The cleaned string with only printable ASCII characters
   * @private
   */
  private removeDangerousCharacters(input: string): string {
    return [...input]
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code >= 32 && code <= 126; // Only printable ASCII
      })
      .join('');
  }

  /**
   * Checks for potentially dangerous patterns in the sanitized string.
   * @param sanitized - The sanitized string to check
   * @param fieldName - The field name for error messages
   * @throws ValidationError if dangerous patterns are detected
   * @private
   */
  private checkForDangerousPatterns(sanitized: string, fieldName: string): void {
    if (sanitized.includes('<script') || sanitized.includes('javascript:')) {
      throw new ValidationError(`Potentially dangerous content detected in ${fieldName}`);
    }
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
    if (!Array.isArray(input)) {
      throw new ValidationError(`Invalid input type for ${fieldName}: expected array, got ${typeof input}`);
    }

    if (input.length > this.maxArrayLength) {
      throw new ValidationError(
        `Array too large for ${fieldName}: ${input.length} items (max: ${this.maxArrayLength})`
      );
    }

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
    try {
      return schema.parse(data);
    } catch (error) {
      logger.error('Input validation failed', {
        fieldName,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Validation failed for ${fieldName}: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw new ValidationError(`Invalid input for ${fieldName}`);
    }
  }

  /**
   * Checks for SQL injection patterns in input strings.
   * @param input - The string to check for injection patterns
   * @throws ValidationError if dangerous patterns are detected
   */
  checkForInjection(input: string): void {
    const dangerousPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(-{2}|\/\*|\*\/)/, // SQL comments
      /('|(\\x27)|(\\x2D))/, // Quotes and dashes
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        throw new ValidationError('Potentially dangerous input pattern detected');
      }
    }
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
/* eslint-disable-next-line import/no-unused-modules */
export const inputSanitizer = new InputSanitizer();
