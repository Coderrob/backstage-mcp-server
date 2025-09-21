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

import { ValidationError } from './custom-errors.js';
import { logger } from './logger.js';

/**
 * Common validation utilities for input validation, sanitization, and parameter checking.
 * Consolidates validation patterns used across guards, error handlers, and utility functions.
 */

/**
 * Validates input data against a Zod schema with standardized error handling.
 * @param data - The data to validate
 * @param schema - The Zod schema to validate against
 * @param fieldName - The name of the field being validated (for error messages)
 * @returns The validated and parsed data
 * @throws ValidationError if the data fails validation
 */
export function validateWithSchema<T>(data: unknown, schema: z.ZodSchema<T>, fieldName: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.error('Input validation failed', {
      fieldName,
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed for ${fieldName}: ${error.issues.map((e) => e.message).join(', ')}`);
    }
    throw new ValidationError(`Invalid input for ${fieldName}`);
  }
}

/**
 * Validates that a value is a string and meets length requirements.
 * @param value - The value to validate
 * @param fieldName - The field name for error messages
 * @param maxLength - Maximum allowed length (default: 10000)
 * @throws ValidationError if validation fails
 */
export function validateString(value: unknown, fieldName: string, maxLength = 10000): asserts value is string {
  if (typeof value !== 'string') {
    throw new ValidationError(`Invalid input type for ${fieldName}: expected string, got ${typeof value}`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`Input too long for ${fieldName}: ${value.length} characters (max: ${maxLength})`);
  }
}

/**
 * Validates that a value is a non-empty string.
 * @param value - The value to validate
 * @param fieldName - The field name for error messages
 * @param maxLength - Maximum allowed length (default: 10000)
 * @throws ValidationError if validation fails
 */
export function validateNonEmptyString(value: unknown, fieldName: string, maxLength = 10000): asserts value is string {
  validateString(value, fieldName, maxLength);
  if (value.trim().length === 0) {
    throw new ValidationError(`Empty string not allowed for ${fieldName}`);
  }
}

/**
 * Validates that a value is a positive integer within specified bounds.
 * @param value - The value to validate
 * @param fieldName - The field name for error messages
 * @param min - Minimum allowed value (default: 1)
 * @param max - Maximum allowed value (optional)
 * @throws ValidationError if validation fails
 */
export function validatePositiveInteger(
  value: unknown,
  fieldName: string,
  min = 1,
  max?: number
): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min) {
    throw new ValidationError(`${fieldName} must be an integer >= ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(`${fieldName} cannot exceed ${max}`);
  }
}

/**
 * Validates that a value is a non-negative integer.
 * @param value - The value to validate
 * @param fieldName - The field name for error messages
 * @throws ValidationError if validation fails
 */
export function validateNonNegativeInteger(value: unknown, fieldName: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative integer`);
  }
}

/**
 * Validates pagination parameters with common constraints.
 * @param params - The pagination parameters to validate
 * @returns Object with validation result and any errors
 */
export function validatePaginationParams(params: { limit?: unknown; offset?: unknown; page?: unknown }): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const MAX_LIMIT = 1000;

  if (params.limit !== undefined) {
    if (typeof params.limit !== 'number' || !Number.isInteger(params.limit) || params.limit < 1) {
      errors.push('limit must be a positive integer');
    } else if (params.limit > MAX_LIMIT) {
      errors.push(`limit cannot exceed ${MAX_LIMIT}`);
    }
  }

  if (params.offset !== undefined) {
    if (typeof params.offset !== 'number' || !Number.isInteger(params.offset) || params.offset < 0) {
      errors.push('offset must be a non-negative integer');
    }
  }

  if (params.page !== undefined) {
    if (typeof params.page !== 'number' || !Number.isInteger(params.page) || params.page < 1) {
      errors.push('page must be a positive integer');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks for SQL injection patterns in input strings.
 * @param input - The string to check for injection patterns
 * @param fieldName - The field name for error messages
 * @throws ValidationError if dangerous patterns are detected
 */
export function checkForSQLInjection(input: string, fieldName: string): void {
  const dangerousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /(-{2}|\/\*|\*\/)/, // SQL comments
    /('|(\\x27)|(\\x2D))/, // Quotes and dashes
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      throw new ValidationError(`Potentially dangerous SQL pattern detected in ${fieldName}`);
    }
  }
}

/**
 * Checks for XSS/script injection patterns in input strings.
 * @param input - The string to check for injection patterns
 * @param fieldName - The field name for error messages
 * @throws ValidationError if dangerous patterns are detected
 */
export function checkForXSS(input: string, fieldName: string): void {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      throw new ValidationError(`Potentially dangerous content detected in ${fieldName}`);
    }
  }
}

/**
 * Sanitizes a string by removing dangerous characters and checking for patterns.
 * @param input - The string to sanitize
 * @param fieldName - The field name for error messages
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns The sanitized string
 * @throws ValidationError if validation fails
 */
export function sanitizeString(input: string, fieldName: string, maxLength = 10000): string {
  validateString(input, fieldName, maxLength);

  // Remove dangerous characters (keep only printable ASCII)
  const sanitized = [...input]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126;
    })
    .join('');

  // Check for dangerous patterns
  checkForXSS(sanitized, fieldName);
  checkForSQLInjection(sanitized, fieldName);

  return sanitized.trim();
}

/**
 * Validates that required configuration values are present.
 * @param config - The configuration object to validate
 * @param requiredFields - Array of required field names
 * @param configName - Name of the configuration for error messages
 * @throws ValidationError if any required fields are missing
 */
export function validateRequiredConfig(
  config: Record<string, unknown>,
  requiredFields: string[],
  configName: string
): void {
  const missingFields = requiredFields.filter((field) => {
    const value = config[field];
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
  });

  if (missingFields.length > 0) {
    throw new ValidationError(`${configName} configuration incomplete: missing ${missingFields.join(', ')}`);
  }
}

/**
 * Validates that an array meets length requirements.
 * @param value - The value to validate as an array
 * @param fieldName - The field name for error messages
 * @param maxLength - Maximum allowed length (default: 1000)
 * @throws ValidationError if validation fails
 */
export function validateArray<T>(value: unknown, fieldName: string, maxLength = 1000): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`Invalid input type for ${fieldName}: expected array, got ${typeof value}`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`Array too long for ${fieldName}: ${value.length} items (max: ${maxLength})`);
  }
}
