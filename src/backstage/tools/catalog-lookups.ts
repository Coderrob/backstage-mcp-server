import type { QueryEntitiesRequest, QueryEntitiesResponse } from '@backstage/catalog-client';
import { type Entity, stringifyEntityRef } from '@backstage/catalog-model';
import type { z } from 'zod';

import { BackstageEntityKind, CatalogLookupField } from '../../shared/constants/backstage-catalog.js';
import type { findUsersInputSchema } from '../../shared/schema.js';
import type {
  CatalogAnnotationLookup,
  CatalogNameLookup,
  CatalogQuery,
  CatalogRelationLookup,
  CatalogTraversalState,
} from '../../types/index.js';

const PAGE_SIZE = 500;
const MAX_REQUESTS = 100;
const RELATION_BATCH_SIZE = 50;
const MAX_ENTITIES = 10000;

/**
 * Creates a query budget shared across every page and graph branch.
 * @param query - Official client query operation.
 * @returns Query wrapper sharing request and entity counters.
 */
function budgetedQuery(query: CatalogQuery): CatalogQuery {
  let requests = 0;
  let entities = 0;
  /**
   * Enforces finite work, including when a backend repeats cursors.
   * @param request The official Catalog query request.
   * @returns The complete official query response.
   * @throws {Error} When the shared request or entity budget is exceeded.
   */
  async function queryWithinBudget(request?: QueryEntitiesRequest): Promise<QueryEntitiesResponse> {
    if (++requests > MAX_REQUESTS) throw new Error('Catalog lookup request budget exceeded');
    const result = await query(request);
    entities += result.items.length;
    if (entities > MAX_ENTITIES) throw new Error('Catalog lookup entity budget exceeded');
    return result;
  }
  return queryWithinBudget;
}

/**
 * Collects every page without resending initial filters with a cursor.
 * @param query - Official client query operation.
 * @param request - Initial filters; subsequent pages use only the cursor.
 * @returns The completed lookup result.
 */
async function collectPages(query: CatalogQuery, request: QueryEntitiesRequest): Promise<Entity[]> {
  const items: Entity[] = [];
  let page = await query({ ...request, limit: PAGE_SIZE });
  items.push(...page.items);
  while (page.pageInfo.nextCursor) {
    page = await query({ cursor: page.pageInfo.nextCursor, limit: PAGE_SIZE });
    items.push(...page.items);
  }
  return items;
}

/**
 * Normalizes case and whitespace without assigning cultural name roles.
 * @param value - Display name or user-supplied name fragment.
 * @returns Lowercased text with whitespace collapsed.
 */
function normalizeName(value: string): string {
  return value.toLocaleLowerCase('en-US').trim().replace(/\s+/g, ' ');
}

/**
 * Checks runtime profile data because arbitrary Catalog entities can have custom schemas.
 * @param entity - Catalog entity with potentially nonstandard profile data.
 * @param fragments - Normalized fragments that must all match.
 * @returns Whether the display name contains every fragment.
 */
function hasMatchingName(entity: Entity, fragments: readonly string[]): boolean {
  const profile = entity.spec?.profile;
  if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) return false;
  const displayName = profile.displayName;
  if (typeof displayName !== 'string') return false;
  return fragments.every(
    /** Requires every supplied name fragment. */ (fragment) => normalizeName(displayName).includes(fragment)
  );
}

/**
 * Finds candidates using standard User display names; scans pages to preserve combination semantics.
 * @param query - Official client query operation.
 * @param input - Validated lookup criteria.
 * @returns The completed lookup result.
 */
export async function findUsers(
  query: CatalogQuery,
  input: Readonly<z.infer<typeof findUsersInputSchema>>
): Promise<Entity[]> {
  const fragments = [input.name.firstName, input.name.lastName]
    .filter(/** Removes absent optional name fragments. */ (value) => value !== undefined)
    .map(normalizeName);
  const filter: Record<string, string> = { kind: BackstageEntityKind.USER };
  if (input.namespace) filter[CatalogLookupField.METADATA_NAMESPACE] = input.namespace;
  const users = await collectPages(budgetedQuery(query), { filter });
  const matches = users.filter(
    /** Retains matching standard User profiles. */ (user) => hasMatchingName(user, fragments)
  );
  return [
    ...new Map(
      matches.map(/** Deduplicates by canonical identity. */ (user) => [stringifyEntityRef(user), user])
    ).values(),
  ];
}

/**
 * Fetches every page for a documented relation target with optional kind constraint.
 * @param query - Official client query operation.
 * @param lookup - Directional relation, canonical target and optional kind.
 * @returns Complete visible matches within bounded work.
 */
export async function queryRelatedEntities(
  query: CatalogQuery,
  lookup: Readonly<CatalogRelationLookup>
): Promise<Entity[]> {
  const filter: Record<string, string | string[]> = {
    [`${CatalogLookupField.RELATIONS}.${lookup.relation}`]: lookup.targetRef,
  };
  if (lookup.kind) filter.kind = lookup.kind;
  const items = await collectPages(budgetedQuery(query), { filter });
  return deduplicate(items);
}

/**
 * Deduplicates processed Catalog entities by canonical reference.
 * @param items - Returned Catalog entities.
 * @returns One entity per canonical reference.
 */
function deduplicate(items: readonly Entity[]): Entity[] {
  return [
    ...new Map(
      items.map(/** Indexes one returned entity by Catalog identity. */ (item) => [stringifyEntityRef(item), item])
    ).values(),
  ];
}

/**
 * Traverses one relation in the reverse lookup direction with cycle protection.
 * @param query - Official client query operation.
 * @param lookup - Directional relation, root reference, kind and recursion mode.
 * @returns Direct children or all visible descendants, excluding the root.
 */
export async function collectDescendants(
  query: CatalogQuery,
  lookup: Readonly<CatalogRelationLookup>
): Promise<Entity[]> {
  if (!lookup.recursive) return queryRelatedEntities(query, lookup);
  const pending = [lookup.targetRef.toLocaleLowerCase('en-US')];
  const seen = new Set(pending);
  const items: Entity[] = [];
  const bounded = budgetedQuery(query);
  while (pending.length > 0) {
    const parents = pending.splice(0, RELATION_BATCH_SIZE);
    const targets = parents.length === 1 ? parents[0] : parents;
    const children = await collectPages(bounded, {
      filter: { [`${CatalogLookupField.RELATIONS}.${lookup.relation}`]: targets },
    });
    appendUnseenChildren(children, { seen, pending, items, kind: lookup.kind });
  }
  return items;
}

/**
 * Adds unseen children to the next relation frontier and selected output.
 * @param children - Entities returned for the current frontier.
 * @param state - Shared queue, seen references and selected output.
 */
function appendUnseenChildren(children: readonly Entity[], state: Readonly<CatalogTraversalState>): void {
  for (const child of children) {
    const ref = stringifyEntityRef(child);
    if (state.seen.has(ref)) continue;
    state.seen.add(ref);
    state.pending.push(ref);
    if (!state.kind || hasIncludedKind(state.kind, child.kind)) state.items.push(child);
  }
}

/**
 * Checks a kind selection after recursively following every intermediate kind.
 * @param selection - Allowed entity kind or kinds.
 * @param kind - Returned entity kind.
 * @returns Whether the kind matches the selection.
 */
function hasIncludedKind(selection: string | string[], kind: string): boolean {
  const kinds = Array.isArray(selection) ? selection : [selection];
  return kinds.some(
    /** Compares Backstage kind values case-insensitively. */ (value) =>
      value.toLocaleLowerCase('en-US') === kind.toLocaleLowerCase('en-US')
  );
}

/**
 * Searches human-readable Catalog names using explicit text-search fields.
 * @param query - Official client query operation.
 * @param lookup - Name fragment and optional kind or namespace constraints.
 * @returns All matching visible entities within bounded work.
 */
export async function searchEntitiesByName(
  query: CatalogQuery,
  lookup: Readonly<CatalogNameLookup>
): Promise<Entity[]> {
  const filter: Record<string, string> = {};
  if (lookup.kind) filter.kind = lookup.kind;
  if (lookup.namespace) filter[CatalogLookupField.METADATA_NAMESPACE] = lookup.namespace;
  const request: QueryEntitiesRequest = {
    fullTextFilter: {
      term: lookup.name,
      fields: [CatalogLookupField.METADATA_NAME, CatalogLookupField.METADATA_TITLE],
    },
    ...(Object.keys(filter).length ? { filter } : {}),
  };
  return deduplicate(await collectPages(budgetedQuery(query), request));
}

/**
 * Finds entities by an exact annotation value using Catalog field filtering.
 * @param query - Official client query operation.
 * @param lookup - Annotation key/value and optional kind or namespace.
 * @returns All visible exact matches within bounded work.
 */
export async function queryEntitiesByAnnotation(
  query: CatalogQuery,
  lookup: Readonly<CatalogAnnotationLookup>
): Promise<Entity[]> {
  const filter: Record<string, string> = { [`${CatalogLookupField.METADATA_ANNOTATIONS}.${lookup.key}`]: lookup.value };
  if (lookup.kind) filter.kind = lookup.kind;
  if (lookup.namespace) filter[CatalogLookupField.METADATA_NAMESPACE] = lookup.namespace;
  return deduplicate(await collectPages(budgetedQuery(query), { filter }));
}
