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
import { z } from 'zod';

import { IToolRegistrationContext } from './common-imports.js';
import { IToolOperation } from './generic-tool-factory.js';

/**
 * Operation for adding locations to the catalog
 */
export class AddLocationOperation implements IToolOperation<typeof AddLocationOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    type: z.string().optional(),
    target: z.string(),
  });

  async execute(
    params: z.infer<typeof AddLocationOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.addLocation(params);
  }
}

/**
 * Operation for getting entity by reference
 */
export class GetEntityByRefOperation implements IToolOperation<typeof GetEntityByRefOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    entityRef: z.union([
      z.string(),
      z.object({
        kind: z.string(),
        namespace: z.string(),
        name: z.string(),
      }),
    ]),
  });

  async execute(
    params: z.infer<typeof GetEntityByRefOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.getEntityByRef(params.entityRef);
  }
}

/**
 * Operation for getting entities from the catalog
 */
export class GetEntitiesOperation implements IToolOperation<typeof GetEntitiesOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    filter: z
      .array(
        z.object({
          key: z.string(),
          values: z.array(z.string()),
        })
      )
      .optional(),
    fields: z.array(z.string()).optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    format: z.enum(['standard', 'jsonapi']).optional().default('jsonapi'),
  });

  async execute(
    params: z.infer<typeof GetEntitiesOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.getEntities(params);
  }
}

/**
 * Operation for getting entities by query
 */
export class GetEntitiesByQueryOperation implements IToolOperation<typeof GetEntitiesByQueryOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    filter: z
      .array(
        z.object({
          key: z.string(),
          values: z.array(z.string()),
        })
      )
      .optional(),
    fields: z.array(z.string()).optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    format: z.enum(['standard', 'jsonapi']).optional().default('jsonapi'),
  });

  async execute(
    params: z.infer<typeof GetEntitiesByQueryOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.getEntities(params);
  }
}

/**
 * Operation for getting entities by refs
 */
export class GetEntitiesByRefsOperation implements IToolOperation<typeof GetEntitiesByRefsOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    entityRefs: z.array(
      z.union([
        z.string(),
        z.object({
          kind: z.string(),
          namespace: z.string(),
          name: z.string(),
        }),
      ])
    ),
    fields: z.array(z.string()).optional(),
  });

  async execute(
    params: z.infer<typeof GetEntitiesByRefsOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    // Convert compound entity refs to strings
    const entityRefs = params.entityRefs.map((ref) =>
      typeof ref === 'string' ? ref : `${ref.kind}:${ref.namespace}/${ref.name}`
    );

    return await context.catalogClient.getEntitiesByRefs({
      entityRefs,
      fields: params.fields,
    });
  }
}

/**
 * Operation for getting entity ancestors
 */
export class GetEntityAncestorsOperation implements IToolOperation<typeof GetEntityAncestorsOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    entityRef: z.union([
      z.string(),
      z.object({
        kind: z.string(),
        namespace: z.string(),
        name: z.string(),
      }),
    ]),
  });

  async execute(
    params: z.infer<typeof GetEntityAncestorsOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    // Convert compound entity ref to string if needed
    const entityRef =
      typeof params.entityRef === 'string'
        ? params.entityRef
        : `${params.entityRef.kind}:${params.entityRef.namespace}/${params.entityRef.name}`;

    return await context.catalogClient.getEntityAncestors({ entityRef });
  }
}

/**
 * Operation for getting entity facets
 */
export class GetEntityFacetsOperation implements IToolOperation<typeof GetEntityFacetsOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    facets: z.array(z.string()),
    filter: z
      .array(
        z.object({
          key: z.string(),
          values: z.array(z.string()),
        })
      )
      .optional(),
  });

  async execute(
    params: z.infer<typeof GetEntityFacetsOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.getEntityFacets({
      facets: params.facets,
      filter: params.filter,
    });
  }
}

/**
 * Operation for validating entities
 */
export class ValidateEntityOperation implements IToolOperation<typeof ValidateEntityOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    entity: z.any(),
    locationRef: z.string(),
  });

  async execute(
    params: z.infer<typeof ValidateEntityOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.validateEntity(params.entity, params.locationRef);
  }
}

/**
 * Operation for getting location by entity
 */
export class GetLocationByEntityOperation implements IToolOperation<typeof GetLocationByEntityOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    entityRef: z.union([
      z.string(),
      z.object({
        kind: z.string(),
        namespace: z.string(),
        name: z.string(),
      }),
    ]),
  });

  async execute(
    params: z.infer<typeof GetLocationByEntityOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    // Convert compound entity ref to string if needed
    const entityRef =
      typeof params.entityRef === 'string'
        ? params.entityRef
        : `${params.entityRef.kind}:${params.entityRef.namespace}/${params.entityRef.name}`;

    return await context.catalogClient.getLocationByEntity(entityRef);
  }
}

/**
 * Operation for getting location by ref
 */
export class GetLocationByRefOperation implements IToolOperation<typeof GetLocationByRefOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    locationRef: z.string(),
  });

  async execute(
    params: z.infer<typeof GetLocationByRefOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.getLocationByRef(params.locationRef);
  }
}

/**
 * Operation for refreshing entity
 */
export class RefreshEntityOperation implements IToolOperation<typeof RefreshEntityOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    entityRef: z.string(),
  });

  async execute(
    params: z.infer<typeof RefreshEntityOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.refreshEntity(params.entityRef);
  }
}

/**
 * Operation for removing entity by UID
 */
export class RemoveEntityByUidOperation implements IToolOperation<typeof RemoveEntityByUidOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    uid: z.string().uuid(),
  });

  async execute(
    params: z.infer<typeof RemoveEntityByUidOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.removeEntityByUid(params.uid);
  }
}

/**
 * Operation for removing location by ID
 */
export class RemoveLocationByIdOperation implements IToolOperation<typeof RemoveLocationByIdOperation.paramsSchema> {
  static readonly paramsSchema = z.object({
    locationId: z.string(),
  });

  async execute(
    params: z.infer<typeof RemoveLocationByIdOperation.paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<unknown> {
    return await context.catalogClient.removeLocationById(params.locationId);
  }
}
