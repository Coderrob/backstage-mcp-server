/* eslint-disable import/no-unused-modules */
// JSON:API specification implementation for richer LLM context
// https://jsonapi.org/

import { DefaultValue, EntityField, JsonApiDocument, JsonApiError, JsonApiResource } from '../../types/index.js';
import { isNonEmptyString, isObject, isString, isStringOrNumber } from '../core/index.js';

export class JsonApiFormatter {
  private static readonly JSON_API_VERSION = '1.0';

  /**
   * Convert Backstage entity to JSON:API resource
   */
  static entityToResource(entity: Record<string, unknown>): JsonApiResource {
    const kind = isNonEmptyString(entity[EntityField.KIND])
      ? String(entity[EntityField.KIND]).toLowerCase()
      : DefaultValue.ENTITY;
    const metaNamespace = isNonEmptyString(entity[EntityField.NAMESPACE])
      ? String(entity[EntityField.NAMESPACE])
      : 'default';
    const metaName = isNonEmptyString(entity[EntityField.NAME]) ? String(entity[EntityField.NAME]) : undefined;

    const resource: JsonApiResource = {
      id: this.getEntityId(entity),
      type: kind,
      attributes: {},
      links: {},
      meta: {
        namespace: metaNamespace,
        kind: entity[EntityField.KIND],
        name: metaName,
      },
    };

    // Add core attributes
    const metadata = (entity[EntityField.METADATA] as Record<string, unknown> | undefined) ?? undefined;
    if (metadata) {
      const metadataTyped = metadata as Record<string, unknown>;
      const rawTags: unknown = metadataTyped['tags'];
      const rawAnnotations: unknown = metadataTyped['annotations'];
      const rawLabels: unknown = metadataTyped['labels'];
      const rawTitle: unknown = metadataTyped['title'];
      const rawDescription: unknown = metadataTyped['description'];
      const rawSpec: unknown = entity[EntityField.SPEC];

      const tags = Array.isArray(rawTags) ? (rawTags as unknown[]) : [];
      const annotations = isObject(rawAnnotations) ? rawAnnotations : {};
      const labels = isObject(rawLabels) ? rawLabels : {};
      const spec =
        rawSpec !== undefined && rawSpec !== null && isObject(rawSpec) ? (rawSpec as Record<string, unknown>) : {};

      const title = rawTitle;
      const description = rawDescription;

      resource.attributes = {
        title: isString(title) ? title : undefined,
        description: isString(description) ? description : undefined,
        tags,
        annotations,
        labels,
        ...spec,
      };
    }

    // Add relationships if they exist
    const relations = Array.isArray(entity.relations) ? (entity.relations as unknown[]) : [];
    if (relations.length > 0) {
      resource.relationships = {};
      relations.forEach((relation: unknown) => {
        const rel = relation as Record<string, unknown> | undefined;
        if (rel && isObject(rel)) {
          const relKey = isNonEmptyString(rel.type) ? String(rel.type).toLowerCase() : 'unknown';
          const targetRef = rel.targetRef as Record<string, unknown> | undefined;
          if (!targetRef || !isObject(targetRef)) return;
          resource.relationships![relKey] = {
            data: {
              id: this.getEntityId(targetRef),
              type: isNonEmptyString(targetRef.kind) ? String(targetRef.kind).toLowerCase() : 'entity',
            },
          };
        }
      });
    }

    // Add self link
    const ns = isNonEmptyString(entity.namespace) ? String(entity.namespace) : 'default';
    const nm = isNonEmptyString(entity.name) ? String(entity.name) : '';
    resource.links = {
      self: `/api/catalog/entities/${resource.type}/${ns}/${nm}`,
    };

    return resource;
  }

  /**
   * Convert entity list to JSON:API document
   */
  static entitiesToDocument(
    entities: Record<string, unknown>[],
    pagination?: {
      limit?: number;
      offset?: number;
      total?: number;
    }
  ): JsonApiDocument {
    const document: JsonApiDocument = {
      data: entities.map((entity) => this.entityToResource(entity)),
      jsonapi: {
        version: this.JSON_API_VERSION,
      },
      meta: {
        total: entities.length,
      },
    };

    // Add pagination links and meta
    if (pagination) {
      document.links = {};
      document.meta = {
        ...document.meta,
        pagination: {
          limit: pagination.limit,
          offset: pagination.offset,
          total: pagination.total,
        },
      };

      const baseUrl = '/api/catalog/entities';
      const params = new URLSearchParams();

      if (pagination.limit !== undefined && pagination.limit !== null) params.set('limit', String(pagination.limit));
      if (pagination.offset !== undefined && pagination.offset !== null)
        params.set('offset', String(pagination.offset));

      document.links.self = `${baseUrl}?${params.toString()}`;

      // Add pagination links
      if (pagination.offset !== undefined && pagination.limit !== undefined && pagination.total !== undefined) {
        const currentPage = Math.floor(pagination.offset / pagination.limit);
        const totalPages = Math.ceil(pagination.total / pagination.limit);

        if (currentPage > 0) {
          params.set('offset', String((currentPage - 1) * pagination.limit));
          document.links.first = `${baseUrl}?${params.toString()}`;
          document.links.prev = `${baseUrl}?${params.toString()}`;
        }

        if (currentPage < totalPages - 1) {
          params.set('offset', String((currentPage + 1) * pagination.limit));
          document.links.next = `${baseUrl}?${params.toString()}`;
          params.set('offset', String((totalPages - 1) * pagination.limit));
          document.links.last = `${baseUrl}?${params.toString()}`;
        }
      }
    }

    return document;
  }

  /**
   * Convert location to JSON:API resource
   */
  static locationToResource(location: Record<string, unknown>): JsonApiResource {
    const id = isStringOrNumber(location['id']) ? String(location['id']) : '';
    const tags = Array.isArray(location['tags'] as unknown) ? (location['tags'] as unknown[]) : [];
    return {
      id: String(id),
      type: 'location',
      attributes: {
        type: location['type'],
        target: location['target'],
        tags,
      },
      links: {
        self: `/api/catalog/locations/${id}`,
      },
      meta: {
        createdAt: location['createdAt'],
        updatedAt: location['updatedAt'],
      },
    };
  }

  /**
   * Create error document
   */
  static createErrorDocument(error: Error | string, status?: string, code?: string): JsonApiDocument {
    const errorObj: JsonApiError = {
      status: status ?? '500',
      code: code ?? 'INTERNAL_ERROR',
      title: 'Internal Server Error',
      detail: isString(error) ? error : error.message,
    };

    return {
      errors: [errorObj],
      jsonapi: {
        version: this.JSON_API_VERSION,
      },
    };
  }

  /**
   * Create success document with meta information
   */
  static createSuccessDocument(
    data: JsonApiResource | JsonApiResource[] | undefined,
    meta?: Record<string, unknown>
  ): JsonApiDocument {
    return {
      data: data,
      meta: meta,
      jsonapi: {
        version: this.JSON_API_VERSION,
      },
    };
  }

  private static getEntityId(entity: Record<string, unknown>): string {
    const namespace = isNonEmptyString(entity['namespace']) ? String(entity['namespace']) : 'default';
    const kind = isNonEmptyString(entity['kind']) ? String(entity['kind']) : 'unknown';
    const name = isNonEmptyString(entity['name']) ? String(entity['name']) : 'unnamed';
    return `${String(kind).toLowerCase()}:${namespace}:${name}`;
  }
}
