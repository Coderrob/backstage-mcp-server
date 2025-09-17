/**
 * Type guard that checks if a value is a string.
 * @param value - The value to check
 * @returns True if the value is a string, false otherwise
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard that checks if a value is a function.
 * @param value - The value to check
 * @returns True if the value is a function, false otherwise
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Type guard that checks if a value is a bigint.
 * @param value - The value to check
 * @returns True if the value is a bigint, false otherwise
 */
export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

/**
 * Type guard that checks if a value is an object (not null and not array).
 * @param value - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard that checks if a value is a number.
 * @param value - The value to check
 * @returns True if the value is a number, false otherwise
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Type guard that checks if a value is a non-empty string.
 * @param value - The value to check
 * @returns True if the value is a non-empty string, false otherwise
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

/**
 * Type guard that checks if a value is a string or number.
 * @param value - The value to check
 * @returns True if the value is a string or number, false otherwise
 */
export function isStringOrNumber(value: unknown): value is string | number {
  return isString(value) || isNumber(value);
}

/**
 * Type guard that checks if a value is not null or undefined.
 * @param value - The value to check
 * @returns True if the value is not null or undefined, false otherwise
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard that checks if a value is a non-empty array.
 * @param value - The value to check
 * @returns True if the value is a non-empty array, false otherwise
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Type guard that checks if a value is null or undefined.
 * @param value - The value to check
 * @returns True if the value is null or undefined, false otherwise
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard that checks if a value is an Error object.
 * @param value - The value to check
 * @returns True if the value is an Error, false otherwise
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
