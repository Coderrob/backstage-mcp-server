---
{
  "id": "backstage.filters",
  "title": "Filters, facets and pagination",
  "classification": {
    "scheme": "BKC",
    "code": "BKC.400"
  },
  "categories": [
    "filter",
    "pagination",
    "facet",
    "query"
  ],
  "status": "curated",
  "reviewed": "2026-09-19",
  "sources": [
    "api"
  ],
  "schema": {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "identifier": "urn:backstage-mcp:knowledge:filters",
    "headline": "Filters, facets and pagination",
    "inLanguage": "en",
    "dateModified": "2026-09-19",
    "about": [
      {
        "@type": "DefinedTerm",
        "termCode": "BKC.400",
        "name": "Filters, facets and pagination",
        "inDefinedTermSet": "urn:backstage-mcp:classification:BKC"
      }
    ],
    "citation": [
      {
        "@type": "CreativeWork",
        "name": "Catalog API",
        "url": "https://backstage.io/docs/features/software-catalog/software-catalog-api/"
      }
    ]
  }
}
---

# Filters, facets and pagination

A Catalog filter record combines its fields with AND. An array of filter records combines the records with OR; alternative values for one field are alternatives, not an intersection. Exact conditions are case-insensitive. Relations use a field such as `relations.partOf` and a full target reference.[^api]

```json
{"filter":[{"kind":"Component","spec.type":"service"},{"kind":"API"}],"limit":100}
```

This selects service Components OR API entities. To constrain both branches to a namespace, include `metadata.namespace` in each record.

| Requirement                    | MCP query                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| Exact name                     | `filter: {"kind":"User","metadata.name":"jane"}`                                                   |
| Display-name substring         | `filter: {"kind":"User"}`, `fullTextFilter: {"term":"Jane","fields":["spec.profile.displayName"]}` |
| Direct System contents         | `filter: {"relations.partOf":"system:default/payments"}`                                           |
| Discover installed kinds/types | `get_entity_facets` with `facets: ["kind","spec.type"]`                                            |

The repository names the fixed paths used by contextual lookups in `CatalogLookupField`; this enum is a selected internal vocabulary, while general Catalog filter keys and projected fields remain open-ended.[^api]

Full-text search matches a case-insensitive substring, not semantic or fuzzy identity. Always select its fields explicitly: the default may use the sort field or UID. Cursor continuation preserves the original query; send only the cursor, page size and desired projection rather than trying to change filters midstream.[^api]

`get_entities` returns one page, including `pageInfo.nextCursor`. Continue until that cursor is absent before claiming to have fetched all results. Projection must retain `kind`, `metadata.name` and `metadata.namespace` when references are needed.[^api]

**Supported surface:** this repository accepts nonempty string conditions and string arrays. The upstream existence sentinel and newer predicate operators are not exposed by that input schema. Read installed SDK declarations and adapter tests before adopting features from newer docs. Name lookups currently page through Users and filter locally to handle multiple fragments and whitespace consistently; this trades query volume for explicit behavior.

[^api]: Backstage project contributors. [Catalog API](https://backstage.io/docs/features/software-catalog/software-catalog-api/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).
