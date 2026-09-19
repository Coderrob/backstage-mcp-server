---
name: backstage-mcp-maintenance
description: Develop or maintain this repository's Backstage MCP tools and curated knowledge, tracing Catalog behavior to sources and validating client contracts, tests and manifests.
---

Start with [the knowledge index](../../../docs/knowledge/README.md) and read only the articles relevant to the proposed behavior. Trace each upstream claim through its named citation and `sources.json`; the original `scratch/docs` snapshot is optional reference material and may have been removed.

Separate upstream contracts from repository algorithms. Verify installed `@backstage/catalog-client` declarations and the current adapter before adopting a feature from newer documentation. Specify matching, namespace defaults, pagination, graph direction, ambiguity and completion bounds before implementing a lookup.

Follow root and tool-directory AGENTS.md conventions. Use the official client through the typed context, one definition per tool, reusable Zod schemas in `src/shared/schema.ts` with `.describe()` on each object and property, policies and response helpers in `src/backstage/tools/shared.ts`, and named contracts under `src/types`. Use the documented kind, relation and annotation enums for fixed tool behavior, leaving generic Catalog inputs open to extensions. Update alphabetical registration, protocol constants, expected tool lists, smoke coverage and the manifest when the tool surface changes.

Maintain at least 95% coverage per production file. Include multi-page results, empty matches, identity collisions, cycle/duplicate handling, bounded failure and upstream rejection where applicable. Avoid casts and collaborator indexed-access types in tests.

Update the relevant curated article, review date, citations and source fingerprints when behavior or evidence changes. Run `yarn docs:check`, formatting/lint, production and test type checks, unit coverage, architecture checks, Knip, manifest verification, shell tests and MCP end-to-end tests. Use a live read-only check when a server and credentials are provided; never record credentials in docs or fixtures.

Evaluate these skills with concrete prompts: find Jane Doe with multiple matching Users; inventory a Domain containing a subdomain and cyclic partOf edge; review an annotation change; add a lookup requiring a newer client feature. Check that the chosen tool, scope, ambiguity handling and validation match the cited contract.
