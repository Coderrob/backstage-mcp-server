---
{
  "id": "backstage.entity-yaml",
  "title": "Entity YAML, kinds and types",
  "classification": {
    "scheme": "BKC",
    "code": "BKC.200"
  },
  "categories": [
    "entity-yaml",
    "kind",
    "spec.type"
  ],
  "status": "curated",
  "reviewed": "2026-09-19",
  "sources": [
    "descriptor",
    "extensions"
  ],
  "schema": {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "identifier": "urn:backstage-mcp:knowledge:entity-yaml",
    "headline": "Entity YAML, kinds and types",
    "inLanguage": "en",
    "dateModified": "2026-09-19",
    "about": [
      {
        "@type": "DefinedTerm",
        "termCode": "BKC.200",
        "name": "Entity YAML, kinds and types",
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
        "name": "Extending the Model",
        "url": "https://backstage.io/docs/features/software-catalog/extending-the-model/"
      }
    ]
  }
}
---

# Entity YAML, kinds and types

An entity descriptor has an `apiVersion`, `kind`, `metadata` and kind-specific `spec`. `metadata.name` is an identifier; a title or display name is presentation data. A namespace participates in identity and defaults to `default` when omitted.[^descriptor]

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payments-api
  namespace: commerce
  annotations:
    backstage.io/techdocs-ref: dir:.
spec:
  type: service
  lifecycle: production
  owner: group:commerce/payments-team
  system: system:commerce/payments
```

This is an illustrative descriptor, not a claim that those referenced entities exist. Validate it in its actual source-location context before registration.

| Kind      | Meaning                       | Useful spec fields                                   |
| --------- | ----------------------------- | ---------------------------------------------------- |
| Component | Software unit                 | `type`, `lifecycle`, `owner`, `system`               |
| API       | Interface definition          | `type`, `lifecycle`, `owner`, `definition`, `system` |
| Resource  | Infrastructure dependency     | `type`, `owner`, `system`                            |
| System    | Related functionality         | `owner`, `domain`                                    |
| Domain    | Business grouping             | `owner`, `subdomainOf`                               |
| User      | Person represented in catalog | `profile`, `memberOf`                                |
| Group     | Organizational grouping       | `type`, `children`, `members`                        |
| Location  | Source discovery              | `type`, `target` or `targets`                        |
| Template  | Scaffolder workflow           | `type`, `owner`, `parameters`, `steps`               |

The table is a navigation aid, not a complete required-field schema; consult the corresponding source section. Standard User profiles have optional `displayName`, `email` and `picture`; there are no standard `firstName` or `lastName` fields.[^descriptor]

The repository exposes these nine documented values as `BackstageEntityKind` in `src/shared/constants/backstage-catalog.ts`; the API kind is spelled `API`. The enum is a vocabulary for standard lookups, not a closed validation rule for Catalog inputs.[^descriptor][^extensions]

`kind` describes the schema family while `spec.type` refines an entity within that family. Type vocabularies are organization-defined; discover actual values with facets instead of assuming a closed enum. Custom kinds or API versions require backend validation and compatible consumers. Reserve the `backstage.io` API version namespace for upstream definitions.[^extensions]

**Repository convention:** keep knowledge metadata in Markdown frontmatter, outside entity YAML. Schema.org fields describe these articles, not the Backstage catalog entity schema.

[^descriptor]: Backstage project contributors. [System Descriptor Format](https://backstage.io/docs/features/software-catalog/descriptor-format/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).

[^extensions]: Backstage project contributors. [Extending the Model](https://backstage.io/docs/features/software-catalog/extending-the-model/). Supplied snapshot reviewed 2026-09-19; source path and SHA-256 in [sources.json](sources.json).
