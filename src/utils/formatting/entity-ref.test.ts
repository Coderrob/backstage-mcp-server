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
import { jest } from '@jest/globals';

import { EntityKind } from '../../types/entities.js';
import { EntityRef } from './entity-ref.js';

describe('EntityRef', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('parse', () => {
    it('should parse full format kind:namespace/name', () => {
      const result = EntityRef.parse('component:default/my-component');
      expect(result).toEqual({
        kind: EntityKind.Component,
        namespace: 'default',
        name: 'my-component',
      });
    });

    it('should parse kind:name with default namespace', () => {
      const result = EntityRef.parse('api:my-api');
      expect(result).toEqual({
        kind: EntityKind.API,
        namespace: DEFAULT_NAMESPACE,
        name: 'my-api',
      });
    });

    it('should parse name only with defaults', () => {
      const result = EntityRef.parse('my-component');
      expect(result).toEqual({
        kind: EntityKind.Component,
        namespace: DEFAULT_NAMESPACE,
        name: 'my-component',
      });
    });

    it('should parse name only with provided options', () => {
      const result = EntityRef.parse('my-service', { kind: EntityKind.Component, namespace: 'custom' });
      expect(result).toEqual({
        kind: EntityKind.Component,
        namespace: 'custom',
        name: 'my-service',
      });
    });

    it('should parse kind:name with provided namespace option (ignored)', () => {
      const result = EntityRef.parse('api:my-api', { namespace: 'ignored' });
      expect(result).toEqual({
        kind: EntityKind.API,
        namespace: DEFAULT_NAMESPACE,
        name: 'my-api',
      });
    });

    it('should throw for empty string', () => {
      expect(() => EntityRef.parse('')).toThrow('Entity reference must be a non-empty string');
    });

    it('should throw for invalid kind', () => {
      expect(() => EntityRef.parse('invalid:default/name')).toThrow('Unknown entity kind');
    });

    it('should throw for empty namespace in full format', () => {
      expect(() => EntityRef.parse('component:/name')).toThrow('Namespace must be a non-empty string');
    });

    it('should throw for empty name in full format', () => {
      expect(() => EntityRef.parse('component:default/')).toThrow('Name must be a non-empty string');
    });

    it('should throw for empty name in kind:name format', () => {
      expect(() => EntityRef.parse('component:')).toThrow('Name must be a non-empty string');
    });
  });

  describe('toString', () => {
    it('should format ref to string', () => {
      const ref: CompoundEntityRef = {
        kind: EntityKind.Component,
        namespace: 'default',
        name: 'my-component',
      };
      expect(EntityRef.toString(ref)).toBe('component:default/my-component');
    });

    it('should throw for invalid ref', () => {
      expect(() => EntityRef.toString(null as unknown as CompoundEntityRef)).toThrow('Invalid reference');
    });

    it('should throw for ref with invalid kind', () => {
      const ref = { kind: 'invalid', namespace: 'default', name: 'name' };
      expect(() => EntityRef.toString(ref)).toThrow('Unknown entity kind');
    });

    it('should throw for ref with empty namespace', () => {
      const ref = { kind: EntityKind.Component, namespace: '', name: 'name' };
      expect(() => EntityRef.toString(ref)).toThrow('Namespace must be a non-empty string');
    });

    it('should throw for ref with empty name', () => {
      const ref = { kind: EntityKind.Component, namespace: 'default', name: '' };
      expect(() => EntityRef.toString(ref)).toThrow('Name must be a non-empty string');
    });
  });

  describe('equals', () => {
    it('should return true for equal refs', () => {
      const a: CompoundEntityRef = { kind: EntityKind.Component, namespace: 'default', name: 'name' };
      const b: CompoundEntityRef = { kind: EntityKind.Component, namespace: 'default', name: 'name' };
      expect(EntityRef.equals(a, b)).toBe(true);
    });

    it('should return false for different kinds', () => {
      const a: CompoundEntityRef = { kind: EntityKind.Component, namespace: 'default', name: 'name' };
      const b: CompoundEntityRef = { kind: EntityKind.API, namespace: 'default', name: 'name' };
      expect(EntityRef.equals(a, b)).toBe(false);
    });

    it('should return false for different namespaces', () => {
      const a: CompoundEntityRef = { kind: EntityKind.Component, namespace: 'default', name: 'name' };
      const b: CompoundEntityRef = { kind: EntityKind.Component, namespace: 'other', name: 'name' };
      expect(EntityRef.equals(a, b)).toBe(false);
    });

    it('should return false for different names', () => {
      const a: CompoundEntityRef = { kind: EntityKind.Component, namespace: 'default', name: 'name1' };
      const b: CompoundEntityRef = { kind: EntityKind.Component, namespace: 'default', name: 'name2' };
      expect(EntityRef.equals(a, b)).toBe(false);
    });

    it('should throw for invalid first ref', () => {
      const a = null as unknown as CompoundEntityRef;
      const b: CompoundEntityRef = { kind: EntityKind.Component, namespace: 'default', name: 'name' };
      expect(() => EntityRef.equals(a, b)).toThrow('Invalid reference');
    });

    it('should throw for invalid second ref', () => {
      const a: CompoundEntityRef = { kind: EntityKind.Component, namespace: 'default', name: 'name' };
      const b = null as unknown as CompoundEntityRef;
      expect(() => EntityRef.equals(a, b)).toThrow('Invalid reference');
    });
  });

  describe('round-trip', () => {
    it('should parse and toString back to original for full format', () => {
      const original = 'component:default/my-component';
      const parsed = EntityRef.parse(original);
      expect(EntityRef.toString(parsed)).toBe(original);
    });

    it('should parse and toString back to full format for kind:name', () => {
      const original = 'api:my-api';
      const parsed = EntityRef.parse(original);
      expect(EntityRef.toString(parsed)).toBe('api:default/my-api');
    });

    it('should parse and toString back to full format for name only', () => {
      const original = 'my-component';
      const parsed = EntityRef.parse(original);
      expect(EntityRef.toString(parsed)).toBe('component:default/my-component');
    });
  });
});
