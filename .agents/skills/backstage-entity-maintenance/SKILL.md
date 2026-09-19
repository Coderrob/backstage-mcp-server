---
name: backstage-entity-maintenance
description: Review or maintain Backstage entity YAML, annotations, kinds and relationships using the curated catalog model and source-aware MCP workflow.
---

Read [entity YAML](../../../docs/knowledge/entity-yaml.md) and the article for the affected concept: [annotations](../../../docs/knowledge/annotations.md) or [relationships](../../../docs/knowledge/relationships.md).

Resolve the complete entity reference and inspect its source provenance. Make persistent edits in the authoritative descriptor or provider. Processed Catalog responses and their generated relations are not source YAML. Preserve managed provenance and avoid inventing standard first/last-name fields.

Use `BackstageEntityKind` for the documented built-in kind vocabulary in repository code; preserve support for custom Catalog kinds. Distinguish `kind` from organization-defined `spec.type`; discover existing values with facets. Use documented annotation syntax and context-specific reference defaults. Keep knowledge-base frontmatter and schema.org article semantics out of entity descriptors.

For an authorized change, prepare the descriptor edit, validate it in its actual location context with `validate_entity`, and use the appropriate source-registration or refresh operation. Check processing results separately; refresh acceptance is not evidence that a new entity was successfully ingested. Respect the requested scope: a review request alone does not authorize catalog deletion or source registration.

Report the source change, validation result, canonical references and any unresolved relation targets. Read [client boundaries](../../../docs/knowledge/catalog-client.md) if the requested operation appears to require an unsupported entity-update API.
