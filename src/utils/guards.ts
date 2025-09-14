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
