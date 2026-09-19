# ADR 0003: Verify MCP behavior at multiple boundaries

- Status: Accepted
- Date: 2026-09-15

## Context

Direct handler unit tests cannot prove that SDK registration, capability negotiation, JSON-RPC framing, packaged executables, or portable schemas work. A black-box Inspector test alone is slower and makes failures harder to localize. The server needs both fast feedback and independent protocol verification.

## Decision

Use layered MCP verification:

- Colocated Vitest unit tests cover definitions, policies, middleware, results, lifecycle, and manifest behavior directly.
- Every behavioral production module must have a side-by-side test, and each covered file must independently reach 95% statements, branches, functions, and lines. Type-only modules are exempt.
- Contract tests connect the official MCP SDK client to the application through linked in-memory transports provided by `@coderrob/mcp-kernel`.
- A CLI smoke test launches the built stdio artifact and communicates through the SDK client.
- The open-source MCP Inspector runs against the built stdio artifact, performs strict `tools/list` schema validation, and calls a tool against a deterministic Backstage stub.
- Inspector state is isolated per run so developer credentials and machine configuration cannot affect results.
- Type checking, zero-tolerance linting, architecture checks, deterministic manifest checks, and bundle validation remain independent gates.

Pin the MCP SDK and Inspector versions used by the suite. Raise the development and CI Node.js floor to the version required by that verified toolchain rather than allowing an untested version range.

## Consequences

- Most behavior failures are caught quickly in-process, while packaging and interoperability defects are caught independently.
- Tests cover both library consumers and the shipped executable.
- The Inspector adds install size and execution time, so it is part of the MCP-specific gate rather than every focused unit-test invocation.
- A deterministic upstream stub avoids live Backstage credentials and network flakiness but does not replace opt-in integration tests against a real deployment.
- Dependency upgrades must rerun all protocol layers and may require an explicit compatibility decision.

## Related material

- [MCP end-to-end testing guide](../testing/mcp-end-to-end-testing.md)
- [Inspector smoke runner](../../scripts/test-inspector.mjs)
- [MCP generic harness implementation plan](../plans/mcp-update.md#testing-strategy)
- [ADR 0001: Adopt a generic MCP application kernel](0001-generic-mcp-application-kernel.md)
