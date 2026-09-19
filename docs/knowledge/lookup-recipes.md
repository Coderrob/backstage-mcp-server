---
{
  "id": "backstage.lookup-recipes",
  "title": "Documentation-driven MCP lookup recipes",
  "classification": {
    "scheme": "BKC",
    "code": "BKC.500"
  },
  "categories": [
    "lookup",
    "user",
    "system",
    "domain",
    "maintenance"
  ],
  "status": "curated",
  "reviewed": "2026-09-19",
  "sources": [
    "descriptor",
    "relations",
    "api"
  ],
  "schema": {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "identifier": "urn:backstage-mcp:knowledge:lookup-recipes",
    "headline": "Documentation-driven MCP lookup recipes",
    "inLanguage": "en",
    "dateModified": "2026-09-19",
    "about": [
      {
        "@type": "DefinedTerm",
        "termCode": "BKC.500",
        "name": "Documentation-driven MCP lookup recipes",
        "inDefinedTermSet": "urn:backstage-mcp:classification:BKC"
      }
    ],
    "citation": [
      {
        "@type": "CreativeWork",
        "name": "System Descriptor Format",
        "url": "https://backstage.io/docs/features/software-catalog/descriptor-format/"
      },
      {
        "@type": "CreativeWork",
        "name": "Well-known Relations",
        "url": "https://backstage.io/docs/features/software-catalog/well-known-relations/"
      },
      {
        "@type": "CreativeWork",
        "name": "Catalog API",
        "url": "https://backstage.io/docs/features/software-catalog/software-catalog-api/"
      }
    ]
  }
}
---

# Documentation-driven MCP lookup recipes

These repository tools compose the documented Catalog query model and processed relation pairs. They are contextual MCP operations, not new upstream Backstage endpoints.[^descriptor][^relations][^api]

| Question                                 | Tool                         | Required input                             | Direct relation or search                     |
| ---------------------------------------- | ---------------------------- | ------------------------------------------ | --------------------------------------------- |
| Who might this person be?                | `find_users_by_name`         | `name.firstName`, `name.lastName`, or both | User `spec.profile.displayName` fragments     |
| Which entities match a name?             | `find_entities_by_name`      | `name`                                     | `metadata.name` or `metadata.title` substring |
| What belongs to a System?                | `get_entities_by_system`     | `systemRef`                                | `partOf`                                      |
| Which Systems are in a Domain?           | `get_systems_by_domain`      | `domainRef`                                | `partOf`, kind System                         |
| What is in a Domain?                     | `get_entities_by_domain`     | `domainRef`                                | recursively follows `partOf` by default       |
| Which subdomains are in a Domain?        | `get_subdomains_by_domain`   | `domainRef`                                | `partOf`, kind Domain                         |
| Which Groups are children of a Group?    | `get_child_groups_by_group`  | `groupRef`                                 | `childOf`, kind Group                         |
| Which Users belong to a Group?           | `get_users_by_group`         | `groupRef`                                 | `memberOf`, kind User                         |
| Which Groups contain a User?             | `get_groups_by_user`         | `userRef`                                  | `hasMember`, kind Group                       |
| What does a User or Group own?           | `get_entities_by_owner`      | `ownerRef`                                 | `ownedBy`                                     |
| Who owns an entity?                      | `get_owners_by_entity`       | `entityRef`                                | `ownerOf`, kind User or Group                 |
| What does an entity depend on?           | `get_dependencies_by_entity` | `entityRef`                                | `dependencyOf`                                |
| What explicitly depends on an entity?    | `get_dependents_by_entity`   | `entityRef`                                | `dependsOn`                                   |
| Which APIs does an entity provide?       | `get_apis_by_provider`       | `providerRef`                              | `apiProvidedBy`, kind API                     |
| Which APIs does an entity consume?       | `get_apis_by_consumer`       | `consumerRef`                              | `apiConsumedBy`, kind API                     |
| Who provides an API?                     | `get_providers_by_api`       | `apiRef`                                   | `providesApi`                                 |
| Who consumes an API?                     | `get_consumers_by_api`       | `apiRef`                                   | `consumesApi`                                 |
| Which entities have an annotation value? | `get_entities_by_annotation` | `key`, `value`                             | exact `metadata.annotations.<key>`            |
| Which entities are orphaned?             | `get_orphaned_entities`      | none                                       | `backstage.io/orphan=true`                    |

All `*Ref` inputs require complete `kind:namespace/name` references. The typed inputs reject an incorrect root kind, such as a Domain reference passed as `systemRef`. `ownerRef` accepts a User or Group. These tools query processed relations; `ownedBy` is responsibility metadata, not an authorization grant, and dependencies express catalog declarations rather than a complete runtime impact model.[^relations][^descriptor]

`find_users_by_name` returns candidates whose standard `spec.profile.displayName` contains every supplied fragment, case-insensitively with whitespace collapsed. Fragment position has no meaning. "Ann" can match "Joanne". The tool does not infer name roles, transliterate names, or search invented first/last-name fields. Resolve ambiguity by reviewing full entity references before any mutation. `find_entities_by_name` uses Backstage full-text substring search over `metadata.name` and `metadata.title`, with optional `kind` and `namespace` filters; it is a candidate search, not an exact identity lookup.[^descriptor][^api]

Direct membership is the default for `get_entities_by_system`, `get_systems_by_domain`, `get_subdomains_by_domain`, and `get_child_groups_by_group`. Set `recursive:true` to traverse their descendants. `get_entities_by_domain` is the deliberate inventory exception: it follows nested Domains, Systems and other `partOf` children by default; set `recursive:false` for direct children. A selected kind filters the _returned_ entities after a recursive walk, so a nested Domain can lead to a matching System. The root is excluded, canonical references prevent duplicates and cycles, and each traversal batches up to 50 parent references per Catalog query. An empty result does not establish whether the root exists or is visible; use `get_entity_by_ref` when existence matters.[^relations]

`get_entities_by_annotation` requires a nonempty exact value and may be narrowed with `kind` or `namespace`. `get_orphaned_entities` uses the processed orphan marker. These operations query current Catalog entities, not source descriptors; see [annotation provenance](annotations.md).[^api]

Each tool returns `{status:"success", data:[...]}`. It follows all Catalog cursor pages and fails rather than returning a partial-success inventory when more than 100 client queries or 10,000 returned entity records are needed. Missing permissions, cache age and catalog changes during traversal can limit a completed result. For larger work, use paginated `get_entities` and maintain the traversal explicitly. The shared Catalog read timeout and cache policy apply.

**Maintenance checks:** verify the relation direction and kind filter, complete references, name ambiguity, direct versus recursive behavior, pagination, duplicate paths, cycles, upstream denial and bounded failure. The packaged MCP smoke suite calls all 19 tools through stdio and an authenticated Catalog HTTP stub; unit tests check their forwarded filters and algorithmic results.

[^descriptor]: Backstage project contributors. [System Descriptor Format](https://backstage.io/docs/features/software-catalog/descriptor-format/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).

[^relations]: Backstage project contributors. [Well-known Relations](https://backstage.io/docs/features/software-catalog/well-known-relations/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).

[^api]: Backstage project contributors. [Catalog API](https://backstage.io/docs/features/software-catalog/software-catalog-api/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).
