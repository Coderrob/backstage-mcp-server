import { z } from 'zod';

export class InputSanitizer {
  private readonly maxStringLength = 10000;
  private readonly maxArrayLength = 1000;
  private readonly allowedCharacters = /^[a-zA-Z0-9\s\-_.@/]+$/;

  /**
   * Sanitizes a string input
   */
  sanitizeString(input: string, fieldName: string): string {
    if (typeof input !== 'string') {
      throw new Error(`Invalid input type for ${fieldName}: expected string, got ${typeof input}`);
    }

    if (input.length > this.maxStringLength) {
      throw new Error(`Input too long for ${fieldName}: ${input.length} characters (max: ${this.maxStringLength})`);
    }

    // Remove null bytes and other dangerous characters
    const sanitized = [...input]
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code >= 32 && code <= 126; // Only printable ASCII
      })
      .join('');

    // Check for potentially dangerous patterns
    if (sanitized.includes('<script') || sanitized.includes('javascript:')) {
      throw new Error(`Potentially dangerous content detected in ${fieldName}`);
    }

    return sanitized.trim();
  }

  /**
   * Sanitizes an array input
   */
  sanitizeArray<T>(input: T[], fieldName: string, itemSanitizer?: (item: T) => T): T[] {
    if (!Array.isArray(input)) {
      throw new Error(`Invalid input type for ${fieldName}: expected array, got ${typeof input}`);
    }

    if (input.length > this.maxArrayLength) {
      throw new Error(`Array too large for ${fieldName}: ${input.length} items (max: ${this.maxArrayLength})`);
    }

    if (itemSanitizer) {
      return input.map(itemSanitizer);
    }

    return input;
  }

  /**
   * Sanitizes entity reference input
   */
  sanitizeEntityRef(
    entityRef: string | { kind: string; namespace: string; name: string }
  ): string | { kind: string; namespace: string; name: string } {
    if (typeof entityRef === 'string') {
      return this.sanitizeString(entityRef, 'entityRef');
    }

    if (typeof entityRef === 'object' && entityRef !== null) {
      return {
        kind: this.sanitizeString(entityRef.kind, 'entityRef.kind'),
        namespace: this.sanitizeString(entityRef.namespace, 'entityRef.namespace'),
        name: this.sanitizeString(entityRef.name, 'entityRef.name'),
      };
    }

    throw new Error('Invalid entity reference format');
  }

  /**
   * Validates and sanitizes filter input
   */
  sanitizeFilter(filter: Array<{ key: string; values: string[] }>): Array<{ key: string; values: string[] }> {
    return this.sanitizeArray(filter, 'filter', (item) => ({
      key: this.sanitizeString(item.key, 'filter.key'),
      values: this.sanitizeArray(item.values, 'filter.values', (value) => this.sanitizeString(value, 'filter.value')),
    }));
  }

  /**
   * General input validation using Zod schemas
   */
  validateWithSchema<T>(data: unknown, schema: z.ZodSchema<T>, fieldName: string): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed for ${fieldName}: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw new Error(`Invalid input for ${fieldName}`);
    }
  }

  /**
   * Checks for SQL injection patterns (basic)
   */
  checkForInjection(input: string): void {
    const dangerousPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(-{2}|\/\*|\*\/)/, // SQL comments
      /('|(\\x27)|(\\x2D))/, // Quotes and dashes
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        throw new Error('Potentially dangerous input pattern detected');
      }
    }
  }

  /**
   * Sanitizes URL input
   */
  sanitizeUrl(url: string): string {
    const sanitized = this.sanitizeString(url, 'url');

    try {
      const parsedUrl = new URL(sanitized);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol');
      }
      return parsedUrl.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }
}

// Global input sanitizer instance
export const inputSanitizer = new InputSanitizer();
