# ADR 0002: Organize cohesive source boundaries in a single package

- Status: Superseded
- Date: 2026-09-15

The local package layout described by this record ended when the generic kernel moved to `@coderrob/mcp-kernel`. See the [current architecture overview](../architecture/overview.md) for the supported source and package boundaries.

## Context

The flat source tree mixed protocol infrastructure, Backstage integration, compatibility code, health concerns, and shared utilities. This obscured ownership and dependency direction. Yarn workspaces were considered as a way to establish boundaries, but the repository currently ships one package, one CLI, one release, and one dependency graph.

Creating workspaces now would add package manifests, cross-package build orchestration, dependency declarations, and versioning decisions without an independent artifact or consumer that needs them.

## Decision

Keep one Yarn package and organize `src` into cohesive folders:

- `mcp/` for the reusable protocol kernel;
- `backstage/` for Backstage authentication, API integration, and domain features;
- `core/` for the class-based compatibility framework;
- `health/` for probes and HTTP health middleware;
- `shared/` for cross-cutting infrastructure;
- `types/` for reusable type-only contracts grouped by concern;
- `testing/` for reusable test support; and
- root source files only for package, composition, manifest, and CLI entrypoints.

Enforce dependency direction and root-file constraints with [`architecture:check`](../../scripts/check-source-layout.mjs). Keep `mcp/` independent of Backstage and compatibility modules so it can be extracted later without first untangling domain dependencies. The kernel may depend on narrowly allowlisted, domain-neutral shared infrastructure and type contracts. Reusable logging contracts are owned by `types/logging.ts`; redaction and stderr-safe sinks are owned solely by `shared/logging`.

Reconsider Yarn workspaces when at least one concrete need appears: the kernel is published independently, another application consumes it, components require separate release cadences, or dependency/runtime requirements materially diverge.

## Consequences

- Ownership and acceptable dependency direction are visible in the filesystem and mechanically checked.
- The project retains a simple install, build, version, and release workflow.
- Internal modules continue to share one dependency graph and package version.
- A future workspace extraction will require package-boundary work, but the generic kernel boundary is prepared for it.
- New root-level source modules must be entrypoints or update the architecture policy deliberately.
- Cross-cutting concerns must have one canonical implementation rather than parallel kernel-specific and shared modules.

## Related material

- [Source organization](../../src/README.md)
- [MCP generic harness implementation plan](../plans/mcp-update.md)
- [ADR 0005](0005-remove-unreachable-compatibility-and-enforce-coverage.md) records the later removal of the compatibility and health groups listed in this decision.
