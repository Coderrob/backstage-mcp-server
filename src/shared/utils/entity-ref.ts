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
import { CompoundEntityRef, DEFAULT_NAMESPACE } from '@backstage/catalog-model';

import { EntityKind } from '../../shared/types/entities.js';
import { assertKind, assertNonEmptyString } from '../../shared/utils/assertions.js';
import { isObject } from '../../shared/utils/guards.js';

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
      const kind = assertKind(kindPart.toLowerCase()); // Convert to lowercase for case-insensitive matching

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
