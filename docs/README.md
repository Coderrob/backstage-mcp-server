# Documentation hub

Use this page to choose the shortest path to the information you need. Current operational and development guides come first; historical analysis, plans, and decision records are kept separately so they do not masquerade as runtime instructions.

## Start by role

### I want to run or connect the server

1. Follow the root [quick start](../README.md#quick-start).
2. Configure external access with the [Backstage Catalog integration guide](integrations/backstage-catalog.md).
3. Use [MCP end-to-end testing](testing/mcp-end-to-end-testing.md) to validate the packaged process or a live deployment.

### I want to add or change a tool

1. Read [Adding a Backstage MCP tool](development/adding-tools.md).
2. Follow the directory rules in [`src/backstage/tools/AGENTS.md`](../src/backstage/tools/AGENTS.md).
3. Use [Repository tooling](development/repository-tooling.md) to select the required gates.
4. Check the [code quality standards](development/code-quality.md) before handoff.

### I want to understand the design

1. Start with the present-tense [architecture overview](architecture/overview.md).
2. Read the [ADR index](adr/README.md) for accepted trade-offs.
3. Consult the historical [architecture analysis](architecture/mcp-architecture-analysis.md) and [generic harness plan](plans/mcp-update.md) when you need migration context.

### I want to maintain dependencies or automation

1. Start with [Dependency management](dependencies/README.md).
2. Follow [Maintenance and upgrades](dependencies/maintenance-and-upgrades.md).
3. Use the [dependency tooling reference](dependencies/tooling-reference.md) for exact Yarn commands and legacy-helper limitations.

## Current guides

| Topic               | Guide                                                       | Answers                                                                         |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Architecture        | [Architecture overview](architecture/overview.md)           | What runs, where it lives, how requests flow, and which boundaries are enforced |
| Tool development    | [Adding a Backstage MCP tool](development/adding-tools.md)  | How to define, register, test, document, and verify a tool                      |
| Repository commands | [Repository tooling](development/repository-tooling.md)     | What every gate proves, its side effects, and when to run it                    |
| Quality policy      | [Code quality standards](development/code-quality.md)       | Which lint, JSDoc, complexity, size, test, and hygiene rules apply              |
| Backstage           | [Catalog integration](integrations/backstage-catalog.md)    | Authentication, permissions, client mapping, queries, and errors                |
| Verification        | [MCP end-to-end testing](testing/mcp-end-to-end-testing.md) | How SDK, CLI, every-tool, Inspector, and live checks prove behavior             |
| Dependencies        | [Dependency management](dependencies/README.md)             | How versions, lockfiles, upgrades, and audits are managed                       |

## Documentation types

- **Guides** describe the current supported way to operate or change the repository.
- **Architecture overviews** explain the present system and its boundaries.
- **Analyses** preserve evidence from a point-in-time assessment; they are not current instructions.
- **Plans** record objectives, delivery phases, and deferred work.
- **ADRs** capture durable decisions and trade-offs. Do not rewrite an accepted decision to make history look current; supersede it when the decision changes.

## Architecture decisions

The [ADR index](adr/README.md) covers the generic MCP kernel, cohesive source boundaries, verification strategy, official Catalog client, per-file coverage, ECMAScript quality limits, BATS, Knip, and the Node.js/toolchain baseline.

## Keeping docs accurate

When behavior changes, update the nearest current guide in the same change. Tool-surface changes also require the generated manifest, integration mapping, contract fixtures, and smoke expectations to agree. Prefer links to `package.json` for pinned tool versions rather than copying version numbers into multiple guides.

The [visual asset guide](assets/README.md) records the purpose and update trigger for each infographic. Images support the text and must not become the only source for operational information.
