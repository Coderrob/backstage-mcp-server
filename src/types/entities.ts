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
  targetRef: IEntityRef;
  [key: string]: unknown;
}

/**
 * Entity reference interface
 */
export interface IEntityRef {
  kind?: string;
  namespace?: string;
  name?: string;
  [key: string]: unknown;
}
