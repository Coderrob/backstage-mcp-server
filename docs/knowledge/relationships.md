---
{
  "id": "backstage.relationships",
  "title": "Entity references and containment relationships",
  "classification": {
    "scheme": "BKC",
    "code": "BKC.300"
  },
  "categories": [
    "entity-reference",
    "relations",
    "system",
    "domain"
  ],
  "status": "curated",
  "reviewed": "2026-09-19",
  "sources": [
    "references",
    "relations",
    "descriptor"
  ],
  "schema": {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "identifier": "urn:backstage-mcp:knowledge:relationships",
    "headline": "Entity references and containment relationships",
    "inLanguage": "en",
    "dateModified": "2026-09-19",
    "about": [
      {
        "@type": "DefinedTerm",
        "termCode": "BKC.300",
        "name": "Entity references and containment relationships",
        "inDefinedTermSet": "urn:backstage-mcp:classification:BKC"
      }
    ],
    "citation": [
      {
        "@type": "CreativeWork",
        "name": "Entity References",
        "url": "https://backstage.io/docs/features/software-catalog/references/"
      },
      {
        "@type": "CreativeWork",
        "name": "Well-known Relations",
        "url": "https://backstage.io/docs/features/software-catalog/well-known-relations/"
      },
      {
        "@type": "CreativeWork",
        "name": "System Descriptor Format",
        "url": "https://backstage.io/docs/features/software-catalog/descriptor-format/"
      }
    ]
  }
}
---

# Entity references and containment relationships

Use full lowercase `kind:namespace/name` references at integration boundaries. Backstage's `stringifyEntityRef` provides canonical serialization. Shorthand YAML references use contextual defaults; do not resolve every omitted namespace by assuming `default`.[^references]

| Forward edge  | Reverse edge    | Meaning                           |
| ------------- | --------------- | --------------------------------- |
| `ownedBy`     | `ownerOf`       | Responsibility, not authorization |
| `partOf`      | `hasPart`       | Structural containment            |
| `memberOf`    | `hasMember`     | Organizational membership         |
| `childOf`     | `parentOf`      | Group hierarchy                   |
| `dependsOn`   | `dependencyOf`  | Dependency                        |
| `providesApi` | `apiProvidedBy` | API provision                     |
| `consumesApi` | `apiConsumedBy` | API consumption                   |

The repository exposes these 14 well-known directions as `BackstageRelation`, aligned with the installed `@backstage/catalog-model` constants. Custom relation types remain valid in the general Catalog model.[^relations]

Relations are directional. Processed entities expose `relations` containing a type and `targetRef`. Prefer those graph edges when querying catalog relationships; source `spec` fields commonly generate the edges, but extensions may contribute them too.[^relations][^descriptor]

To find direct contents of a System, query `relations.partOf=system:commerce/payments`. For a Domain, first find entities pointing to the Domain, then repeat from each result. This includes Systems, subdomains, components and other entities linked through `partOf`. A Domain filter alone does not automatically expand through Systems.[^relations]

**Repository algorithms:** contextual tools query the named relation direction. `get_entities_by_system` and `get_entities_by_domain` follow inverse `partOf` edges; `get_users_by_group` uses `memberOf`, while `get_groups_by_user` uses `hasMember`. Ownership, dependency and API lookups use their corresponding forward or reverse relation from the table above. Recursive traversals follow all pages, deduplicate canonical references, exclude the root and protect against cycles. They do not infer edges across unrelated relation types. "All" means visible reachable entities observed during the calls, not a transactionally consistent global snapshot.

See [lookup recipes and bounds](lookup-recipes.md) before interpreting an inventory as complete.

[^references]: Backstage project contributors. [Entity References](https://backstage.io/docs/features/software-catalog/references/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).

[^relations]: Backstage project contributors. [Well-known Relations](https://backstage.io/docs/features/software-catalog/well-known-relations/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).

[^descriptor]: Backstage project contributors. [System Descriptor Format](https://backstage.io/docs/features/software-catalog/descriptor-format/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).
