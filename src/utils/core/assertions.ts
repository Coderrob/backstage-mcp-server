import { EntityKind, VALID_ENTITY_KINDS } from '../../types/entities.js';
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
