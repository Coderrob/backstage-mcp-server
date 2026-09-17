# ADR 0008: Enforce unused-code and dependency analysis with Knip

- Status: Accepted
- Date: 2026-09-15

## Context

Type checking and linting detect unused declarations within individual modules but do not reliably identify unreachable files, unused public exports, stale package dependencies, or imports satisfied only accidentally by transitive dependencies. The repository had accumulated obsolete runtime packages, superseded development tooling, and compatibility files outside the maintained execution paths.

## Decision

Use a pinned Knip release as a zero-tolerance CI gate. Model the published library surface, executable CLI, repository automation, and tool configuration as explicit or plugin-discovered entrypoints. Fail verification when Knip reports unused files, exports, dependencies, development dependencies, undeclared imports, or redundant configuration.

Keep exceptions narrow and documented in `knip.json`. BATS and MCP Inspector are exceptions because maintained runners locate their executable files at runtime rather than importing their package names statically.

Remove unreachable compatibility files and dependencies instead of suppressing valid findings. Declare directly imported tooling packages even when a transitive copy currently makes the import resolve.

## Consequences

- Dead functionality and stale dependency declarations fail CI.
- The package does not rely on accidental transitive dependencies for lint configuration.
- New non-import entrypoints must be added to the Knip configuration deliberately.
- Runtime-resolved tools require a reviewed exception until their invocation becomes statically discoverable.

## Related material

- [Code quality standards](../development/code-quality.md#reachability-and-dependency-hygiene)
- [Knip configuration](../../knip.json)
- [Repository package scripts](../../package.json)
