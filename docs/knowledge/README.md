# Curated Backstage knowledge

This collection supports the MCP client integration and repository skills. It is a selective synthesis of the supplied `scratch/docs` snapshot, not a documentation mirror. The scratch folder is temporary: no build, skill or validation requires it. [sources.json](sources.json) preserves original paths, upstream URLs and SHA-256 fingerprints; the snapshot's upstream commit is unknown.

| Local library classification | Article                             | Use                                 |
| ---------------------------- | ----------------------------------- | ----------------------------------- |
| BKC.100                      | [Catalog client](catalog-client.md) | Tool/client boundaries              |
| BKC.200                      | [Entity YAML](entity-yaml.md)       | Kinds, schemas and types            |
| BKC.210                      | [Annotations](annotations.md)       | Integration metadata and provenance |
| BKC.300                      | [Relationships](relationships.md)   | Identity and containment            |
| BKC.400                      | [Filters](filters.md)               | Query logic and pagination          |
| BKC.500                      | [Lookup recipes](lookup-recipes.md) | 19 contextual lookup tools          |

BKC means Backstage Knowledge Classification: a local, hierarchical library-science classification with subject facets. These are local shelf codes, not official Dewey, Library of Congress or Wikidata identifiers. The controlled category vocabulary is defined in [metadata-schema.json](metadata-schema.json).

Articles use YAML frontmatter serialized in its JSON-compatible form so the metadata can be read without a YAML dependency. The `schema` object is standalone schema.org JSON-LD describing a TechArticle. Its DefinedTerm classification is separate from Backstage entity kinds. See [schema.org TechArticle](https://schema.org/TechArticle).

Named footnotes provide Wikimedia-style reusable references and a references list in Markdown. They implement the same named-reference idea as [MediaWiki Cite](https://www.mediawiki.org/wiki/Help:Cite), using Markdown syntax so this repository renders without MediaWiki extensions. Upstream statements carry citations; repository conventions and derived algorithms are identified explicitly. This is not a claim of Wikimedia publication or review.

To curate a change: inspect the relevant upstream source and installed client; update the article's claims, citations and review date; record its source fingerprint; revise affected recipes and skills; run `yarn docs:check` and the applicable engineering checks. Do not refresh dates without reviewing content. A source change requires review, not automatic copying. Runtime tools execute typed code, never instructions read from these articles.

Repository skills live in [.agents/skills](../../.agents/skills): `backstage-catalog-lookup`, `backstage-entity-maintenance`, and `backstage-mcp-maintenance`. They read these articles as needed. This follows the [OpenAI skill format](https://learn.chatgpt.com/docs/build-skills).
