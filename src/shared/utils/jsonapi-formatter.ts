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
// JSON:API specification implementation for richer LLM context
// https://jsonapi.org/

import { IApiDocument, IApiError, IApiResource } from '../../shared/types/apis.js';
import { DefaultValue, EntityField } from '../../shared/types/constants.js';
import {
  isDefined,
  isNonEmptyArray,
  isNonEmptyString,
  isObject,
  isString,
  isStringOrNumber,
} from '../../shared/utils/guards.js';

export class JsonApiFormatter {
  private static readonly JSON_API_VERSION = '1.0';

  /**
   * Convert Backstage entity to JSON:API resource
   */
  static entityToResource(entity: Record<string, unknown>): IApiResource {
    const kind = isNonEmptyString(entity[EntityField.KIND])
      ? String(entity[EntityField.KIND]).toLowerCase()
      : DefaultValue.ENTITY;
    const metaNamespace = isNonEmptyString(entity[EntityField.NAMESPACE])
      ? String(entity[EntityField.NAMESPACE])
      : 'default';
    const metaName = isNonEmptyString(entity[EntityField.NAME]) ? String(entity[EntityField.NAME]) : undefined;

    const resource: IApiResource = {
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
      const spec = isDefined(rawSpec) && isObject(rawSpec) ? (rawSpec as Record<string, unknown>) : {};

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
    if (isNonEmptyArray(relations)) {
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
  ): IApiDocument {
    const document: IApiDocument = {
      data: entities.map((entity) => this.entityToResource(entity)),
      jsonapi: {
        version: this.JSON_API_VERSION,
      },
      meta: {
        total: entities.length,
      },
      version: this.JSON_API_VERSION,
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

      if (isDefined(pagination.limit)) params.set('limit', String(pagination.limit));
      if (isDefined(pagination.offset)) params.set('offset', String(pagination.offset));

      document.links.self = `${baseUrl}?${params.toString()}`;

      // Add pagination links
      if (isDefined(pagination.offset) && isDefined(pagination.limit) && isDefined(pagination.total)) {
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
  static locationToResource(location: Record<string, unknown>): IApiResource {
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
  static createErrorDocument(error: Error | string, status?: string, code?: string): IApiDocument {
    const errorObj: IApiError = {
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
      version: this.JSON_API_VERSION,
    };
  }

  /**
   * Create success document with meta information
   */
  static createSuccessDocument(
    data: IApiResource | IApiResource[] | undefined,
    meta?: Record<string, unknown>
  ): IApiDocument {
    return {
      data: data,
      meta: meta,
      jsonapi: {
        version: this.JSON_API_VERSION,
      },
      version: this.JSON_API_VERSION,
    };
  }

  private static getEntityId(entity: Record<string, unknown>): string {
    const namespace = isNonEmptyString(entity['namespace']) ? String(entity['namespace']) : 'default';
    const kind = isNonEmptyString(entity['kind']) ? String(entity['kind']) : 'unknown';
    const name = isNonEmptyString(entity['name']) ? String(entity['name']) : 'unnamed';
    return `${String(kind).toLowerCase()}:${namespace}:${name}`;
  }
}
