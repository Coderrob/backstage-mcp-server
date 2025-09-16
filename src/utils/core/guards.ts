/**
 *
 * @param value
 * @returns
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 *
 * @param value
 * @returns
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 *
 * @param value
 * @returns
 */
export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

/**
 * Checks if the value is an object (not null and not array).
 * @param value
 * @returns
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if the value is a number.
 * @param value
 * @returns
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Checks if the value is a non-empty string.
 * @param value
 * @returns
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

/**
 * Checks if the value is a string or number.
 * @param value
 * @returns
 */
export function isStringOrNumber(value: unknown): value is string | number {
  return isString(value) || isNumber(value);
}
