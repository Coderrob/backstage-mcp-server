import { CompoundEntityRef, DEFAULT_NAMESPACE } from '@backstage/catalog-model';

import { EntityKind } from '../../types/entities.js';
import { assertKind, assertNonEmptyString } from '../core/assertions.js';
import { isObject } from '../core/guards.js';

const DEFAULTS = {
  kind: EntityKind.Component,
  namespace: DEFAULT_NAMESPACE,
};

function partsAfter(value: string, delim: string): [string, string?] {
  const idx = value.indexOf(delim);
  return idx === -1 ? [value] : [value.slice(0, idx), value.slice(idx + delim.length)];
}

function freeze<T extends object>(o: T): Readonly<T> {
  return Object.freeze({ ...o });
}

/**
 * Simple utility class for parsing and formatting Backstage entity references.
 * Supports the three main formats:
 * - kind:namespace/name (full format)
 * - kind:name (namespace defaults to 'default')
 * - name (kind defaults to 'component', namespace to 'default')
 */
export class EntityRef {
  private constructor() {}

  static parse(refString: string, options: { namespace?: string; kind?: EntityKind } = {}): CompoundEntityRef {
    const source = assertNonEmptyString('Entity reference', refString);
    const { namespace = DEFAULT_NAMESPACE, kind } = options;

    // Case A: kind present? (has ':')
    if (source.includes(':')) {
      const [kindPart, maybeRest] = partsAfter(source, ':');
      const kind = assertKind(kindPart);

      // Case A1: kind:namespace/name
      if (maybeRest?.includes('/')) {
        const [nsPart, namePart] = partsAfter(maybeRest, '/');
        const namespace = assertNonEmptyString('Namespace', nsPart);
        const name = assertNonEmptyString('Name', namePart ?? '');
        return freeze({ kind, namespace, name });
      }

      // Case A2: kind:name (namespace defaults)
      const name = assertNonEmptyString('Name', maybeRest ?? '');
      return freeze({ kind, namespace: DEFAULT_NAMESPACE, name });
    }

    // Case B: name only (use defaults or provided values)
    const nameOnly = source;
    return freeze({
      kind: kind ?? DEFAULTS.kind,
      namespace: namespace,
      name: nameOnly,
    });
  }

  static toString(ref: CompoundEntityRef): string {
    EntityRef.assertRef(ref);
    return `${ref.kind}:${ref.namespace}/${ref.name}`;
  }

  static equals(a: CompoundEntityRef, b: CompoundEntityRef): boolean {
    EntityRef.assertRef(a);
    EntityRef.assertRef(b);
    return a.kind === b.kind && a.namespace === b.namespace && a.name === b.name;
  }

  private static assertRef(ref: CompoundEntityRef): void {
    if (!ref || !isObject(ref)) {
      throw new Error('Invalid reference');
    }
    assertKind(ref.kind);
    assertNonEmptyString('Namespace', ref.namespace);
    assertNonEmptyString('Name', ref.name);
  }
}
