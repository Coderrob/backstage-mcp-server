# ADR 0005: Remove unreachable compatibility code and enforce per-file verification

- Status: Accepted
- Date: 2026-09-15

The kernel ownership described by this record later moved to the independently published `@coderrob/mcp-kernel` package. Its decisions about removing compatibility code and enforcing per-file verification remain in effect; the [current architecture overview](../architecture/overview.md) describes the package boundary.

## Context

The generic MCP kernel became the only runtime reachable from the package and CLI entrypoints, but the repository still contained parallel decorator, builder, registry, middleware, execution, health, and utility implementations. Keeping unreachable alternatives inflated the maintenance and coverage denominator, obscured which abstractions were supported, and allowed similarly named concerns—especially logging—to diverge.

Aggregate coverage also allowed a well-tested adapter to hide an undertested lifecycle kernel. A test count alone did not prove that each maintained module had an explicit verification owner.

## Decision

Remove the compatibility implementations that are unreachable from `src/index.ts` and `src/cli.ts`. Keep one generic implementation under `src/mcp`, the Backstage integration under `src/backstage`, and shared cross-cutting implementations under `src/shared`. In particular, `src/shared/logging/logger.ts` is the only logging implementation used by the MCP kernel and application composition.

Require a side-by-side `<module>.test.ts` file for every behavioral production TypeScript module. Enforce the relationship in `architecture:check`. Exempt type-only modules under `src/types` because they emit no executable behavior.

Use Vitest with V8 coverage and require each included production file—not merely the repository aggregate—to reach at least 95% statements, branches, functions, and lines.

## Consequences

- There is one supported MCP authoring and lifecycle model instead of parallel compatibility paths.
- Every executable module has an obvious colocated verification point.
- A single weakly tested file fails the build even when aggregate coverage is high.
- Defensive and failure branches require explicit tests, which increases suite size but makes lifecycle and policy behavior auditable.
- Downstream consumers of removed internal compatibility paths must migrate to the exported generic harness; those paths were not reachable from the package exports.
- Adding a new production module requires adding its colocated test in the same change.

## Related material

- [Source organization](../../src/README.md)
- [MCP end-to-end testing guide](../testing/mcp-end-to-end-testing.md)
- [MCP generic harness implementation plan](../plans/mcp-update.md)
- [ADR 0002: Organize cohesive source boundaries in a single package](0002-source-boundaries-and-single-package.md)
- [ADR 0003: Verify MCP behavior at multiple boundaries](0003-mcp-verification-strategy.md)
