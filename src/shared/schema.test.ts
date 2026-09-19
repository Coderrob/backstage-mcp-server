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

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  annotationLookupInputSchema,
  apiLookupInputSchema,
  catalogFilterSchema,
  consumerLookupInputSchema,
  domainInventoryInputSchema,
  domainLookupInputSchema,
  entityNameLookupInputSchema,
  entityRefSchema,
  fieldsSchema,
  findUsersInputSchema,
  groupHierarchyInputSchema,
  groupLookupInputSchema,
  orphanLookupInputSchema,
  ownerLookupInputSchema,
  providerLookupInputSchema,
  queryEntitiesInputSchema,
  successOutputSchema,
  systemLookupInputSchema,
  targetEntityInputSchema,
  userLookupInputSchema,
} from './schema.js';

/**
 * Checks a Zod object and each named property for a meaningful description.
 * @param schema - Object schema exposed to an MCP caller.
 */
function expectObjectDescriptions(schema: z.AnyZodObject): void {
  expect(schema.description).toMatch(/\S/);
  const shape: unknown = schema.shape;
  if (typeof shape !== 'object' || shape === null) throw new Error('Expected a Zod object shape');
  for (const property of Object.values(shape)) {
    expect(property).toBeInstanceOf(z.ZodType);
    if (property instanceof z.ZodType) expect(property.description).toMatch(/\S/);
  }
}

describe('shared Backstage schemas', () => {
  it('should describes every exported object and nested property', () => {
    const schemas = [
      annotationLookupInputSchema,
      apiLookupInputSchema,
      catalogFilterSchema,
      consumerLookupInputSchema,
      domainInventoryInputSchema,
      domainLookupInputSchema,
      entityNameLookupInputSchema,
      entityRefSchema,
      fieldsSchema,
      findUsersInputSchema,
      groupHierarchyInputSchema,
      groupLookupInputSchema,
      orphanLookupInputSchema,
      ownerLookupInputSchema,
      providerLookupInputSchema,
      queryEntitiesInputSchema,
      successOutputSchema,
      systemLookupInputSchema,
      targetEntityInputSchema,
      userLookupInputSchema,
    ];
    for (const schema of schemas) {
      expect(schema.description).toMatch(/\S/);
      if (schema instanceof z.ZodObject) expectObjectDescriptions(schema);
    }
    expectObjectDescriptions(entityRefSchema.options[1]);
    expectObjectDescriptions(findUsersInputSchema.shape.name.innerType());
    expectObjectDescriptions(queryEntitiesInputSchema.shape.order.unwrap());
    expectObjectDescriptions(queryEntitiesInputSchema.shape.fullTextFilter.unwrap());
    expectObjectDescriptions(queryEntitiesInputSchema.shape.orderFields.unwrap().options[0]);
  });

  it('should keep generic kind inputs open to custom Catalog kinds', () => {
    expect(entityRefSchema.safeParse({ kind: 'CustomKind', namespace: 'default', name: 'item' }).success).toBe(true);
    expect(entityNameLookupInputSchema.safeParse({ name: 'item', kind: 'CustomKind' }).success).toBe(true);
    expect(queryEntitiesInputSchema.safeParse({ filter: { kind: 'CustomKind' } }).success).toBe(true);
  });

  it('should requires a nonempty Catalog filter record', () => {
    expect(catalogFilterSchema.safeParse({}).success).toBe(false);
    expect(catalogFilterSchema.safeParse({ kind: 'Component' }).success).toBe(true);
  });
});
