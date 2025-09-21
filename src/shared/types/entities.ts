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
import { Entity } from '@backstage/catalog-model';

/**
 * Enumeration of valid Backstage entity kinds
 */
export enum EntityKind {
  API = 'api',
  Component = 'component',
  Domain = 'domain',
  Group = 'group',
  Location = 'location',
  Resource = 'resource',
  System = 'system',
  User = 'user',
  Template = 'template',
}

/**
 * Set of valid Backstage entity kinds for quick lookup
 */
export const VALID_ENTITY_KINDS: ReadonlySet<EntityKind> = new Set<EntityKind>([
  EntityKind.API,
  EntityKind.Component,
  EntityKind.Domain,
  EntityKind.Group,
  EntityKind.Location,
  EntityKind.Resource,
  EntityKind.System,
  EntityKind.Template,
  EntityKind.User,
]);

/**
 * Backstage entity interface
 */
export interface IBackstageEntity extends Omit<Entity, 'spec' | 'metadata'> {
  apiVersion: string;
  kind: string;
  metadata: IEntityMetadata;
  spec?: Record<string, unknown>;
  relations?: IEntityRelation[];
}

/**
 * Entity metadata interface
 */
export interface IEntityMetadata {
  namespace?: string;
  name?: string;
  title?: string;
  description?: string;
  tags?: string[];
  annotations?: Record<string, string>;
  labels?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Entity relation interface
 */
export interface IEntityRelation {
  type: string;
  targetRef: string;
}
