/* eslint-disable import/no-unused-modules */
// JSON:API specification implementation for richer LLM context
// https://jsonapi.org/

export interface JsonApiResource {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, JsonApiRelationship>;
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export interface JsonApiRelationship {
  data?: JsonApiResourceIdentifier | JsonApiResourceIdentifier[];
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export interface JsonApiResourceIdentifier {
  id: string;
  type: string;
  meta?: Record<string, unknown>;
}

export interface JsonApiDocument {
  data?: JsonApiResource | JsonApiResource[];
  errors?: JsonApiError[];
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
  included?: JsonApiResource[];
  jsonapi?: {
    version: string;
    meta?: Record<string, unknown>;
  };
}

export interface JsonApiError {
  id?: string;
  links?: Record<string, string>;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
    header?: string;
  };
  meta?: Record<string, unknown>;
}

export class JsonApiFormatter {
  private static readonly JSON_API_VERSION = '1.0';

  /**
   * Convert Backstage entity to JSON:API resource
   */
  static entityToResource(entity: Record<string, unknown>): JsonApiResource {
    const kind =
      typeof entity.kind === 'string' && entity.kind.length > 0 ? String(entity.kind).toLowerCase() : 'entity';
    const metaNamespace =
      typeof entity.namespace === 'string' && entity.namespace.length > 0 ? String(entity.namespace) : 'default';
    const metaName = typeof entity.name === 'string' && entity.name.length > 0 ? String(entity.name) : undefined;

    const resource: JsonApiResource = {
      id: this.getEntityId(entity),
      type: kind,
      attributes: {},
      links: {},
      meta: {
        namespace: metaNamespace,
        kind: entity.kind,
        name: metaName,
      },
    };

    // Add core attributes
    const metadata = (entity.metadata as Record<string, unknown> | undefined) ?? undefined;
    if (metadata) {
      const metadataTyped = metadata as Record<string, unknown>;
      const rawTags: unknown = metadataTyped['tags'];
      const rawAnnotations: unknown = metadataTyped['annotations'];
      const rawLabels: unknown = metadataTyped['labels'];
      const rawTitle: unknown = metadataTyped['title'];
      const rawDescription: unknown = metadataTyped['description'];
      const rawSpec: unknown = entity.spec;

      const tags = Array.isArray(rawTags) ? (rawTags as unknown[]) : [];
      const annotations =
        rawAnnotations !== undefined &&
        rawAnnotations !== null &&
        typeof rawAnnotations === 'object' &&
        !Array.isArray(rawAnnotations)
          ? (rawAnnotations as Record<string, unknown>)
          : {};
      const labels =
        rawLabels !== undefined && rawLabels !== null && typeof rawLabels === 'object' && !Array.isArray(rawLabels)
          ? (rawLabels as Record<string, unknown>)
          : {};
      const spec =
        rawSpec !== undefined && rawSpec !== null && typeof rawSpec === 'object' && !Array.isArray(rawSpec)
          ? (rawSpec as Record<string, unknown>)
          : {};

      const title = rawTitle;
      const description = rawDescription;

      resource.attributes = {
        title: typeof title === 'string' ? title : undefined,
        description: typeof description === 'string' ? description : undefined,
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
        if (rel && typeof rel === 'object' && !Array.isArray(rel)) {
          const relKey =
            typeof rel.type === 'string' && rel.type.length > 0 ? String(rel.type).toLowerCase() : 'unknown';
          const targetRef = rel.targetRef as Record<string, unknown> | undefined;
          if (!targetRef || typeof targetRef !== 'object' || Array.isArray(targetRef)) return;
          resource.relationships![relKey] = {
            data: {
              id: this.getEntityId(targetRef),
              type:
                typeof targetRef.kind === 'string' && targetRef.kind.length > 0
                  ? String(targetRef.kind).toLowerCase()
                  : 'entity',
            },
          };
        }
      });
    }

    // Add self link
    const ns =
      typeof entity.namespace === 'string' && entity.namespace.length > 0 ? String(entity.namespace) : 'default';
    const nm = typeof entity.name === 'string' && entity.name.length > 0 ? String(entity.name) : '';
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
    const id = typeof location['id'] === 'string' || typeof location['id'] === 'number' ? String(location['id']) : '';
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
      detail: typeof error === 'string' ? error : error.message,
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
  static createSuccessDocument(data: unknown, meta?: Record<string, unknown>): JsonApiDocument {
    return {
      data: data as JsonApiResource | JsonApiResource[] | undefined,
      meta: meta,
      jsonapi: {
        version: this.JSON_API_VERSION,
      },
    };
  }

  private static getEntityId(entity: Record<string, unknown>): string {
    const namespace =
      typeof entity['namespace'] === 'string' && entity['namespace'].length > 0
        ? String(entity['namespace'])
        : 'default';
    const kind = typeof entity['kind'] === 'string' && entity['kind'].length > 0 ? String(entity['kind']) : 'unknown';
    const name = typeof entity['name'] === 'string' && entity['name'].length > 0 ? String(entity['name']) : 'unnamed';
    return `${String(kind).toLowerCase()}:${namespace}:${name}`;
  }
}
