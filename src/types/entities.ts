import { ComponentEntity } from '@backstage/catalog-model';

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
export interface IBackstageEntity {
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
  targetRef: ComponentEntity;
}
