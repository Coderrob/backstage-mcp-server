# ADR 0004: Delegate Catalog protocol behavior to the official Backstage client

- Status: Accepted
- Date: 2026-09-15

## Context

The repository manually constructed Catalog REST paths, query parameters, authentication, and response handling. This implementation still used the deprecated `GET /entities` endpoint for the exposed entity-list tool and encoded several inactive methods differently from the current Catalog API. It also advertised OAuth refresh, API-key, and service-account modes that do not by themselves implement Backstage's documented external-access model.

Backstage publishes `@backstage/catalog-client` as the frontend- and backend-compatible implementation of the Catalog API. Its current query API uses `/entities/by-query`, supports cursor pagination and full-text filtering, and owns the protocol details for entity references and location dry runs.

## Decision

- Use the official `CatalogClient` behind `BackstageCatalogApi` for endpoint selection, request encoding, and response semantics.
- Keep `IBackstageCatalogApi` as the injectable application boundary so MCP handlers remain easy to test.
- Use `queryEntities` for the `get_entities` MCP tool instead of deprecated `getEntities` behavior.
- Expose current query fields: `orderFields`, `fullTextFilter`, `totalItems`, and `cursor`.
- Expose the current `addLocation` `onConflict` option.
- Accept `BACKSTAGE_TOKEN` as the standalone process credential and send it as a bearer token. The token may be a Backstage static external-access token or a JWT accepted by a configured JWKS provider.
- Do not emulate Backstage's internal plugin-to-plugin token issuance or claim that arbitrary API keys and service-account strings are Backstage authentication modes.

## Consequences

- Catalog protocol changes are primarily absorbed by an upstream client upgrade instead of repeated hand-maintained URL code.
- The runtime depends on the Node.js Fetch API, which is available at the current runtime floor recorded by [ADR 0009](0009-standardize-node-24-and-harden-automation.md).
- Consumers using the old MCP `order` and `after` fields must move to `orderFields` and `cursor`.
- Existing deployments using the removed credential environment variables must provision a supported external-access bearer token.
- Authentication and permissions remain deployment responsibilities; this process cannot mint Backstage plugin-to-plugin tokens because it runs outside the Backstage backend.
- Colocated adapter tests pin the expected endpoint, query, location, and Authorization-header behavior during future dependency updates.

## Related material

- [Backstage Catalog integration guide](../integrations/backstage-catalog.md)
- [MCP end-to-end testing guide](../testing/mcp-end-to-end-testing.md)
- [ADR 0001: Adopt a generic MCP application kernel](0001-generic-mcp-application-kernel.md)
- [ADR 0009: Standardize Node.js 24 and harden dependency automation](0009-standardize-node-24-and-harden-automation.md)
