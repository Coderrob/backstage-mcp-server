# Documentation

Repository documentation is separated by purpose so that observations, future work, and accepted decisions do not become indistinguishable.

## Architecture analysis

- [MCP architecture and implementation analysis](architecture/mcp-architecture-analysis.md) records the pre-harness baseline, evidence, risks, and recommended direction. It is historical context rather than a description of the current implementation.

## Implementation plans

- [MCP generic harness implementation plan](plans/mcp-update.md) records the target design, delivered phases, acceptance criteria, and future transport boundaries.

## Testing

- [MCP end-to-end testing](testing/mcp-end-to-end-testing.md) documents the canonical gate, the real process and protocol boundaries it exercises, expected results, and the distinction between deterministic black-box validation and testing a live Backstage deployment.

## Dependencies

- [Dependency management](dependencies/README.md) is the entry point for installation verification and sources of truth.
- [Maintenance and upgrades](dependencies/maintenance-and-upgrades.md) defines the version, security, lockfile-review, and verification policy.
- [Dependency tooling reference](dependencies/tooling-reference.md) records supported Yarn 4 commands and the limitations of the repository's older Bash helpers.

## Development

- [Code quality standards](development/code-quality.md) records the enforced complexity, size, and documentation requirements for ECMAScript modules.

## Integrations

- [Backstage Catalog integration](integrations/backstage-catalog.md) records the supported Catalog API surface, external-access authentication model, current endpoint mappings, and upstream documentation baseline.

## Architecture decision records

The [ADR index](adr/README.md) contains the durable decisions extracted from the analysis and implementation work:

- [ADR 0001: Adopt a generic MCP application kernel](adr/0001-generic-mcp-application-kernel.md)
- [ADR 0002: Organize cohesive source boundaries in a single package](adr/0002-source-boundaries-and-single-package.md)
- [ADR 0003: Verify MCP behavior at multiple boundaries](adr/0003-mcp-verification-strategy.md)
- [ADR 0004: Delegate Catalog protocol behavior to the official Backstage client](adr/0004-official-backstage-catalog-client.md)
- [ADR 0005: Remove unreachable compatibility code and enforce per-file verification](adr/0005-remove-unreachable-compatibility-and-enforce-coverage.md)
- [ADR 0006: Enforce strict ECMAScript module quality limits](adr/0006-enforce-mjs-quality-limits.md)
- [ADR 0007: Test shell automation with colocated BATS suites](adr/0007-test-shell-automation-with-bats.md)
- [ADR 0008: Enforce unused-code and dependency analysis with Knip](adr/0008-enforce-unused-code-analysis-with-knip.md)
- [ADR 0009: Standardize Node.js 24 and harden dependency automation](adr/0009-standardize-node-24-and-harden-automation.md)

Use an analysis document to explain what exists, a plan to describe intended work, and an ADR to record a consequential decision and its tradeoffs.
