# Backstage Catalog Integration

## Documentation baseline

This integration was reviewed on 2026-09-15 against the current stable Backstage documentation and package releases:

- [Software Catalog API](https://backstage.io/docs/features/software-catalog/software-catalog-api/)
- [Service-to-service authentication](https://backstage.io/docs/auth/service-to-service-auth/)
- [CatalogClient API reference](https://backstage.io/api/stable/classes/_backstage_catalog-client.index.CatalogClient.html)
- [Entity descriptor format](https://backstage.io/docs/features/software-catalog/descriptor-format/)
- [Backstage documentation landing page](https://backstage.io/docs/landing-page/doc-landing-page)

The supported Backstage dependency ranges and exact lockfile resolutions live in [`package.json`](../../package.json) and [`yarn.lock`](../../yarn.lock). Review the official release notes and rerun all adapter and black-box tests before upgrading them.

## Runtime boundary

`BackstageCatalogApi` wraps the official `CatalogClient`. The wrapper supplies discovery for the configured Catalog base URL and a fetch function that adds the external-access bearer token. The upstream client owns REST paths, query serialization, status handling, entity-reference parsing, and location behavior.

`BACKSTAGE_BASE_URL` may be either:

- the Backstage backend root, such as `https://backstage.example.com`; or
- the explicit Catalog plugin root, such as `https://backstage.example.com/api/catalog`.

The adapter normalizes both forms without appending `/api/catalog` twice.

## Authentication and permissions

Set either `BACKSTAGE_TOKEN` to a token value or `BACKSTAGE_TOKEN_FILE` to the path of a file containing a token accepted by the target Backstage deployment. File-backed tokens are trimmed and read before every outgoing request so an external secret manager can rotate them without restarting the server. `BACKSTAGE_TOKEN_FILE` takes precedence when both variables are set.

For this standalone external process, the documented token options are:

- a sufficiently strong static token configured in `backend.auth.externalAccess`; or
- a JWT accepted by a configured JWKS external-access entry.

Both are sent as `Authorization: Bearer <token>`. Configure `accessRestrictions` for the `catalog` plugin and, where permissions are enabled, limit permission names or action attributes to what the MCP deployment needs.

Backstage's standard plugin-to-plugin flow obtains target-specific tokens from the backend auth service. External callers cannot use that flow, so this repository does not attempt to mint those tokens. It also does not reinterpret arbitrary API keys or service-account secrets as valid Backstage credentials.

## MCP-to-Catalog mapping

| MCP tool                 | Official client method | Catalog behavior                                                                                        |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `add_location`           | `addLocation`          | Adds or dry-runs a location; `dryRun` and `onConflict` retain official-client semantics                 |
| `get_entities`           | `queryEntities`        | Current entity query with filters, fields, ordering, full-text search, totals, and cursor continuation  |
| `get_entities_by_query`  | `queryEntities`        | Compatibility tool name using the same current query API; legacy `order` is normalized to `orderFields` |
| `get_entities_by_refs`   | `getEntitiesByRefs`    | Batch entity lookup with optional field projection                                                      |
| `get_entity_ancestors`   | `getEntityAncestors`   | Retrieves the entity ancestry graph                                                                     |
| `get_entity_by_ref`      | `getEntityByRef`       | Retrieves one entity; absence becomes MCP `NOT_FOUND`                                                   |
| `get_entity_facets`      | `getEntityFacets`      | Retrieves facet counts for requested fields and optional filters                                        |
| `get_location_by_entity` | `getLocationByEntity`  | Retrieves an entity's source location; absence becomes MCP `NOT_FOUND`                                  |
| `get_location_by_ref`    | `getLocationByRef`     | Retrieves a location by reference; absence becomes MCP `NOT_FOUND`                                      |
| `refresh_entity`         | `refreshEntity`        | Requests refresh processing and invalidates the local `catalog` cache tag                               |
| `remove_entity_by_uid`   | `removeEntityByUid`    | Permanently removes an entity and is advertised as destructive                                          |
| `remove_location_by_id`  | `removeLocationById`   | Permanently removes a location and is advertised as destructive                                         |
| `validate_entity`        | `validateEntity`       | Validates an entity descriptor in a source-location context without mutating Catalog state              |

Backstage HTTP statuses are preserved at the MCP boundary: 401 becomes `AUTHENTICATION_REQUIRED`, 403 becomes `INSUFFICIENT_PERMISSIONS`, 409 becomes `CONFLICT`, and 429 becomes `RATE_LIMITED`. Other HTTP and connectivity failures become `UPSTREAM_ERROR` without exposing credentials or upstream response bodies.

### Querying entities

`get_entities` accepts:

- `filter`: one non-empty filter record or a non-empty array of records; keys within a record are AND conditions, values within one key are OR conditions, and multiple records are OR groups;
- `fields`: dot-separated entity field paths to retain;
- `orderFields`: one or more `{ field, order }` directives;
- `fullTextFilter`: a term and optional field paths;
- `limit` and optional initial `offset`;
- `totalItems`: `include` or `exclude`; and
- `cursor`: the opaque next or previous cursor returned in `pageInfo`.

When `cursor` is supplied, the adapter sends a cursor request containing only `cursor`, `fields`, and `limit`. Filters, ordering, full-text terms, offsets, and total-count behavior belong to the initial query and are encoded in the cursor by Backstage.

For example, `{ "kind": ["Component", "API"], "metadata.namespace": "default" }` means `(kind = Component OR kind = API) AND metadata.namespace = default`. Supplying that record alongside `{ "metadata.name": "payments" }` in an array makes the two complete records alternatives. Empty records, empty string values, and empty value arrays are rejected before a request is sent.

Catalog relations use `targetRef`. The removed legacy `relation.target` representation is not supported. Entity inputs and outputs use JSON entity descriptors, and external references should use canonical string entity references such as `component:default/payments`.

### Adding locations

`dryRun: true` validates and processes a location without writing it. Successful dry runs can return discovered entities and whether the location already exists.

`onConflict` controls an existing location:

- `reject` is the default and returns a conflict; and
- `refresh` marks the existing location for refresh and returns a successful creation response.

Use `add_location` only with a credential and Backstage permission policy authorized for Catalog creation. Prefer dry-run mode before mutation.

## Verification

The colocated [`backstage-catalog-api.test.ts`](../../src/backstage/api/backstage-catalog-api.test.ts) verifies URL normalization, modern entity-query serialization, filter AND/OR semantics, reference-batch projection and chunking, missing-reference normalization, canonical ancestry/facet/location paths, validation request bodies, external bearer authentication, and location query/body separation. [`auth-manager.test.ts`](../../src/backstage/auth/auth-manager.test.ts) verifies file-backed token loading, rotation, and safe failures.

There is no active request path to Backstage's deprecated `GET /entities` endpoint; the unreachable legacy compatibility implementation has been removed.

The [MCP end-to-end testing guide](../testing/mcp-end-to-end-testing.md) documents the built-process SDK and Inspector tests. Those tests run the same official client adapter against deterministic Backstage-compatible HTTP stubs.

## Curated lookups

The [contextual lookup catalog](../knowledge/lookup-recipes.md) documents all 19 named read tools, their complete entity-reference inputs, relation direction, recursion defaults and result bounds. Each composes the official `queryEntities` method and returns the standard structured MCP success envelope. The catalog covers name candidates; System and Domain inventory; Group membership and hierarchy; ownership; dependencies; API providers and consumers; annotations; and orphaned entities.
