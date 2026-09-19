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

import {
  CATALOG_QUERY_LIMIT_MAXIMUM,
  CatalogResultStatus,
  CatalogSortOrder,
  CatalogTotalItemsMode,
} from './constants/backstage-catalog.js';

/** Common success envelope emitted by Catalog tools. */
export const successOutputSchema = z
  .object({
    status: z.literal(CatalogResultStatus.SUCCESS).describe('Successful Catalog operation status.'),
    data: z.unknown().optional().describe('Catalog result data, when the operation returns a value.'),
  })
  .describe('Successful Backstage Catalog tool response.');

/** String or structured compound entity reference accepted by Catalog tools. */
export const entityRefSchema = z
  .union([
    z.string().min(1).describe('Entity reference in kind:namespace/name form.'),
    z
      .object({
        kind: z.string().min(1).describe('Backstage entity kind; custom kinds are allowed.'),
        namespace: z.string().min(1).describe('Backstage entity namespace.'),
        name: z.string().min(1).describe('Backstage entity name.'),
      })
      .describe('Structured Backstage entity reference.'),
  ])
  .describe('Backstage entity reference as a string or structured object.');

const filterValueSchema = z
  .union([
    z.string().min(1).describe('One exact Catalog filter value.'),
    z
      .array(z.string().min(1).describe('Exact Catalog filter value.'))
      .min(1)
      .describe('Alternative values for one filter key.'),
  ])
  .describe('One exact value or a nonempty list of alternatives.');

/**
 * Reports whether a Catalog filter contains a condition.
 * @param filter - Parsed Catalog filter record.
 * @returns Whether at least one filter key exists.
 */
function hasFilterEntries(filter: Readonly<Record<string, unknown>>): boolean {
  return Object.keys(filter).length > 0;
}

/** One non-empty key-value Catalog filter set. */
const filterRecordSchema = z
  .record(filterValueSchema)
  .refine(hasFilterEntries, 'Catalog filter records cannot be empty')
  .describe('AND conditions keyed by Catalog field or relation path.');

/** One AND filter record or multiple OR filter records. */
export const catalogFilterSchema = z
  .union([
    filterRecordSchema,
    z.array(filterRecordSchema).min(1).describe('OR alternatives of Catalog filter records.'),
  ])
  .describe('Catalog filter with AND conditions in a record and OR across records.');

/** Optional response-field projection. */
export const fieldsSchema = z
  .array(z.string().min(1).describe('Catalog entity field path to return.'))
  .min(1)
  .optional()
  .describe('Optional nonempty projection of entity field paths.');

const orderFieldSchema = z
  .object({
    field: z.string().min(1).describe('Catalog field path used for sorting.'),
    order: z.nativeEnum(CatalogSortOrder).describe('Ascending or descending sort direction.'),
  })
  .describe('One Catalog sort field and direction.');

/** Query input shared by the modern and compatibility entity-query tools. */
export const queryEntitiesInputSchema = z
  .object({
    filter: catalogFilterSchema.optional().describe('Optional exact-match Catalog filter.'),
    fields: fieldsSchema.describe('Optional entity fields to include in the response.'),
    order: z
      .object({
        field: z.string().min(1).describe('Catalog field path used for legacy sorting.'),
        order: z.nativeEnum(CatalogSortOrder).optional().describe('Sort direction; ascending when omitted.'),
      })
      .describe('Legacy single-field sort order.')
      .optional()
      .describe('Legacy single-field sort order.'),
    orderFields: z
      .union([orderFieldSchema, z.array(orderFieldSchema).min(1).describe('Ordered Catalog sort fields.')])
      .optional()
      .describe('One or more Catalog sort fields.'),
    limit: z
      .number()
      .int()
      .positive()
      .max(CATALOG_QUERY_LIMIT_MAXIMUM)
      .optional()
      .describe('Maximum entities to return in one page.'),
    offset: z.number().int().nonnegative().optional().describe('Zero-based offset for offset pagination.'),
    fullTextFilter: z
      .object({
        term: z.string().trim().min(1).describe('Search term matched by Catalog full-text search.'),
        fields: z
          .array(z.string().min(1).describe('Entity field path to search.'))
          .min(1)
          .optional()
          .describe('Optional fields searched for the full-text term.'),
      })
      .describe('Catalog full-text search parameters.')
      .optional()
      .describe('Optional full-text search term and field selection.'),
    totalItems: z.nativeEnum(CatalogTotalItemsMode).optional().describe('Whether to calculate total item count.'),
    cursor: z.string().min(1).optional().describe('Opaque cursor for the next Catalog query page.'),
  })
  .describe('Backstage Catalog entity query, filtering, projection, sorting, and pagination.');

/** Name fragments are matched against displayName, without inferring name order. */
export const findUsersInputSchema = z
  .object({
    name: z
      .object({
        firstName: z.string().trim().min(1).optional().describe('User given-name fragment to match in displayName.'),
        lastName: z.string().trim().min(1).optional().describe('User family-name fragment to match in displayName.'),
      })
      .describe('One or both human-name fragments to search.')
      .refine(
        /** Requires at least one searchable name fragment. */
        (input) => Boolean(input.firstName ?? input.lastName),
        'Provide firstName, lastName, or both'
      )
      .describe('One or both human-name fragments to search.'),
    namespace: z.string().trim().min(1).optional().describe('Optional User namespace to search.'),
  })
  .describe('Find Users by given name, family name, or both.');

/** Complete canonical entity reference at an MCP integration boundary. */
const canonicalRefSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9]*:[a-z0-9][-a-z0-9]*\/[a-z0-9][-a-z0-9_.]*$/i)
  .describe('Complete entity reference in kind:namespace/name form.');

/** Root System identity, with explicit descendant expansion. */
export const systemLookupInputSchema = z
  .object({
    systemRef: canonicalRefSchema.regex(/^system:/i).describe('Complete root System reference.'),
    recursive: z.boolean().default(false).describe('Include nested Systems and their entities when true.'),
  })
  .describe('Find entities in a System, optionally including descendant Systems.');

/** Root Domain identity, with direct membership by default. */
export const domainLookupInputSchema = z
  .object({
    domainRef: canonicalRefSchema.regex(/^domain:/i).describe('Complete root Domain reference.'),
    recursive: z.boolean().default(false).describe('Include descendant Domains when true.'),
  })
  .describe('Find Systems or subdomains within a Domain.');

/** Domain inventory includes nested Systems and their contents by default. */
export const domainInventoryInputSchema = z
  .object({
    domainRef: canonicalRefSchema.regex(/^domain:/i).describe('Complete root Domain reference.'),
    recursive: z.boolean().default(true).describe('Include descendant Domains and Systems when true.'),
  })
  .describe('Inventory entities within a Domain and its Systems.');

/** Group membership lookup uses a complete Group reference. */
export const groupLookupInputSchema = z
  .object({ groupRef: canonicalRefSchema.regex(/^group:/i).describe('Complete Group reference.') })
  .describe('Find members or children of a Group.');

/** Group hierarchy lookup can expand descendants explicitly. */
export const groupHierarchyInputSchema = groupLookupInputSchema
  .extend({ recursive: z.boolean().default(false).describe('Include descendant Groups when true.') })
  .describe('Find direct or descendant child Groups.');

/** User membership lookup uses a complete User reference. */
export const userLookupInputSchema = z
  .object({ userRef: canonicalRefSchema.regex(/^user:/i).describe('Complete User reference.') })
  .describe('Find Groups that contain a User.');

/** Ownership lookup accepts a User or Group owner. */
export const ownerLookupInputSchema = z
  .object({
    ownerRef: canonicalRefSchema.regex(/^(?:user|group):/i).describe('Complete User or Group owner reference.'),
  })
  .describe('Find entities owned by a User or Group.');

/** A target entity for directional graph lookups. */
export const targetEntityInputSchema = z
  .object({ entityRef: canonicalRefSchema.describe('Complete target entity reference.') })
  .describe('Find relationships of one Catalog entity.');

/** API provider lookup accepts a complete entity reference. */
export const providerLookupInputSchema = z
  .object({ providerRef: canonicalRefSchema.describe('Complete API provider entity reference.') })
  .describe('Find APIs provided by an entity.');

/** API consumer lookup accepts a complete entity reference. */
export const consumerLookupInputSchema = z
  .object({ consumerRef: canonicalRefSchema.describe('Complete API consumer entity reference.') })
  .describe('Find APIs consumed by an entity.');

/** API reverse lookup requires the target API reference. */
export const apiLookupInputSchema = z
  .object({ apiRef: canonicalRefSchema.regex(/^api:/i).describe('Complete API reference.') })
  .describe('Find providers or consumers of an API.');

/** Name candidate search can be narrowed to one kind or namespace. */
export const entityNameLookupInputSchema = z
  .object({
    name: z.string().trim().min(1).describe('Entity name or title search term.'),
    kind: z.string().trim().min(1).optional().describe('Optional entity kind to search.'),
    namespace: z.string().trim().min(1).optional().describe('Optional entity namespace to search.'),
  })
  .describe('Find entities by name or title.');

/** Exact annotation lookup, optionally narrowed by kind and namespace. */
export const annotationLookupInputSchema = z
  .object({
    key: z
      .string()
      .trim()
      .regex(/^[a-z0-9.-]+\/[a-z0-9._-]+$/i)
      .describe('Qualified annotation key such as backstage.io/managed-by-location.'),
    value: z.string().min(1).describe('Exact annotation value to match.'),
    kind: z.string().trim().min(1).optional().describe('Optional entity kind to search.'),
    namespace: z.string().trim().min(1).optional().describe('Optional entity namespace to search.'),
  })
  .describe('Find entities by an exact qualified annotation key and value.');

/** Orphan inventory can be narrowed without altering its documented marker. */
export const orphanLookupInputSchema = z
  .object({
    kind: z.string().trim().min(1).optional().describe('Optional orphaned entity kind.'),
    namespace: z.string().trim().min(1).optional().describe('Optional orphaned entity namespace.'),
  })
  .describe('Find entities marked as orphaned in the Catalog.');
