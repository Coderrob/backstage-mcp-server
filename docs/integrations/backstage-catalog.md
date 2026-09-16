# Backstage Catalog Integration

## Documentation baseline

This integration was reviewed on 2026-09-15 against the current stable Backstage documentation and package releases:

- [Software Catalog API](https://backstage.io/docs/features/software-catalog/software-catalog-api/)
- [Service-to-service authentication](https://backstage.io/docs/auth/service-to-service-auth/)
- [CatalogClient API reference](https://backstage.io/api/stable/classes/_backstage_catalog-client.index.CatalogClient.html)
- [Entity descriptor format](https://backstage.io/docs/features/software-catalog/descriptor-format/)
- [Backstage documentation landing page](https://backstage.io/docs/landing-page/doc-landing-page)

The runtime pins `@backstage/catalog-client` 1.16.2 and `@backstage/catalog-model` 1.10.1. Review the official release notes and rerun all adapter and black-box tests before upgrading them.

## Runtime boundary

`BackstageCatalogApi` wraps the official `CatalogClient`. The wrapper supplies discovery for the configured Catalog base URL and a fetch function that adds the external-access bearer token. The upstream client owns REST paths, query serialization, status handling, entity-reference parsing, and location behavior.

`BACKSTAGE_BASE_URL` may be either:

- the Backstage backend root, such as `https://backstage.example.com`; or
- the explicit Catalog plugin root, such as `https://backstage.example.com/api/catalog`.

The adapter normalizes both forms without appending `/api/catalog` twice.

## Authentication and permissions

Set `BACKSTAGE_TOKEN` to a token accepted by the target Backstage deployment. For this standalone external process, the documented options are:

- a sufficiently strong static token configured in `backend.auth.externalAccess`; or
- a JWT accepted by a configured JWKS external-access entry.

Both are sent as `Authorization: Bearer <token>`. Configure `accessRestrictions` for the `catalog` plugin and, where permissions are enabled, limit permission names or action attributes to what the MCP deployment needs.

Backstage's standard plugin-to-plugin flow obtains target-specific tokens from the backend auth service. External callers cannot use that flow, so this repository does not attempt to mint those tokens. It also does not reinterpret arbitrary API keys or service-account secrets as valid Backstage credentials.

## MCP-to-Catalog mapping

| MCP tool            | Official client method | Catalog API behavior                                                                                      |
| ------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `get_entities`      | `queryEntities`        | `GET /entities/by-query` for key-value queries and cursor continuation                                    |
| `get_entity_by_ref` | `getEntityByRef`       | `GET /entities/by-name/{kind}/{namespace}/{name}`; 404 becomes an MCP `NOT_FOUND` result                  |
| `add_location`      | `addLocation`          | `POST /locations`; `dryRun` and `onConflict` are query parameters while `type` and `target` form the body |

Backstage HTTP statuses are preserved at the MCP boundary: 401 becomes `AUTHENTICATION_REQUIRED`, 403 becomes `INSUFFICIENT_PERMISSIONS`, 409 becomes `CONFLICT`, and 429 becomes `RATE_LIMITED`. Other HTTP and connectivity failures become `UPSTREAM_ERROR` without exposing credentials or upstream response bodies.

### Querying entities

`get_entities` accepts:

- `filter`: one filter record or an array of records; records are AND groups and the array represents OR groups;
- `fields`: dot-separated entity field paths to retain;
- `orderFields`: one or more `{ field, order }` directives;
- `fullTextFilter`: a term and optional field paths;
- `limit` and optional initial `offset`;
- `totalItems`: `include` or `exclude`; and
- `cursor`: the opaque next or previous cursor returned in `pageInfo`.

When `cursor` is supplied, the adapter sends a cursor request containing only `cursor`, `fields`, and `limit`. Filters, ordering, full-text terms, offsets, and total-count behavior belong to the initial query and are encoded in the cursor by Backstage.

Catalog relations use `targetRef`. The removed legacy `relation.target` representation is not supported. Entity inputs and outputs use JSON entity descriptors, and external references should use canonical string entity references such as `component:default/payments`.

### Adding locations

`dryRun: true` validates and processes a location without writing it. Successful dry runs can return discovered entities and whether the location already exists.

`onConflict` controls an existing location:

- `reject` is the default and returns a conflict; and
- `refresh` marks the existing location for refresh and returns a successful creation response.

Use `add_location` only with a credential and Backstage permission policy authorized for Catalog creation. Prefer dry-run mode before mutation.

## Verification

The colocated [`backstage-catalog-api.test.ts`](../../src/backstage/api/backstage-catalog-api.test.ts) verifies URL normalization, modern entity-query serialization, canonical entity-reference routing, external bearer authentication, and location query/body separation.

There is no active request path to Backstage's deprecated `GET /entities` endpoint; the unreachable legacy compatibility implementation has been removed.

The [MCP end-to-end testing guide](../testing/mcp-end-to-end-testing.md) documents the built-process SDK and Inspector tests. Those tests run the same official client adapter against deterministic Backstage-compatible HTTP stubs.
