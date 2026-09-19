---
{
  "id": "backstage.catalog-client",
  "title": "Catalog client and MCP boundaries",
  "classification": {
    "scheme": "BKC",
    "code": "BKC.100"
  },
  "categories": [
    "catalog-client",
    "mcp",
    "crud"
  ],
  "status": "curated",
  "reviewed": "2026-09-19",
  "sources": [
    "api",
    "life"
  ],
  "schema": {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "identifier": "urn:backstage-mcp:knowledge:catalog-client",
    "headline": "Catalog client and MCP boundaries",
    "inLanguage": "en",
    "dateModified": "2026-09-19",
    "about": [
      {
        "@type": "DefinedTerm",
        "termCode": "BKC.100",
        "name": "Catalog client and MCP boundaries",
        "inDefinedTermSet": "urn:backstage-mcp:classification:BKC"
      }
    ],
    "citation": [
      {
        "@type": "CreativeWork",
        "name": "Catalog API",
        "url": "https://backstage.io/docs/features/software-catalog/software-catalog-api/"
      },
      {
        "@type": "CreativeWork",
        "name": "The Life of an Entity",
        "url": "https://backstage.io/docs/features/software-catalog/life-of-an-entity/"
      }
    ]
  }
}
---

# Catalog client and MCP boundaries

Use the official `@backstage/catalog-client` through `BackstageMcpContext.catalogClient`. The adapter owns discovery, authentication and request timeouts. Tools compose client operations; they do not assemble Catalog HTTP URLs. API responses contain processed entities, so they are not necessarily the original YAML.[^api][^life]

| Intent                                   | Client method                         | MCP tool                                    |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------- |
| Filter or paginate                       | `queryEntities`                       | `get_entities`                              |
| Contextual relationship and name lookups | `queryEntities`                       | [19 named lookup tools](lookup-recipes.md)  |
| Resolve identity                         | `getEntityByRef`, `getEntitiesByRefs` | `get_entity_by_ref`, `get_entities_by_refs` |
| Discover values                          | `getEntityFacets`                     | `get_entity_facets`                         |
| Register a source                        | `addLocation`                         | `add_location`                              |
| Validate source data                     | `validateEntity`                      | `validate_entity`                           |
| Request processing                       | `refreshEntity`                       | `refresh_entity`                            |

**Repository convention:** This MCP surface is not arbitrary entity CRUD. Source registration, validation, refresh and removal have distinct semantics. Edit the authoritative descriptor/provider for persistent data changes; a refresh requests processing and does not prove processing succeeded. An entity can reappear after removal if its source still supplies it.[^life]

Read the [filter contract](filters.md) before adding lookup composition. Preserve the shared error mapping, read policy and cache invalidation rules in `src/backstage/tools/shared.ts`. Supported SDK behavior is determined by `package.json`, `yarn.lock` and installed declarations; a newer upstream API feature does not imply that this MCP schema exposes it.

**Extension recipe:** declare the named contract under `src/types`, implement one tool module, register its constant and alphabetic index entry, add behavioral tests and update smoke lists and the generated manifest. See [adding tools](../development/adding-tools.md).

[^api]: Backstage project contributors. [Catalog API](https://backstage.io/docs/features/software-catalog/software-catalog-api/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).

[^life]: Backstage project contributors. [The Life of an Entity](https://backstage.io/docs/features/software-catalog/life-of-an-entity/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).
