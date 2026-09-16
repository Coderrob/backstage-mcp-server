# ADR 0007: Test shell automation with colocated BATS suites

- Status: Accepted
- Date: 2026-09-15

## Context

The repository contains Bash entrypoints for dependency maintenance, operational monitoring, and build validation. Vitest does not execute shell functions or validate Bash command behavior, while exercising these scripts directly can create reports, logs, backups, or other files in the working tree.

## Decision

Use BATS as the shell-script test framework and pin its package version. Place one same-name `.bats` suite beside every `.sh` script under `scripts`, and enforce that relationship in `architecture:check`.

Make each shell entrypoint safe to source with a `BASH_SOURCE` execution guard. BATS tests copy scripts into a per-test temporary project and stub external commands there, keeping the repository and real dependency state unchanged.

Use a small Node.js launcher for platform selection. It honors `BASH_PATH`, uses `bash` from `PATH` on Unix-like systems, and detects Git for Windows Bash on Windows. CI and developers invoke the same `yarn test:shell` command.

## Consequences

- Shell argument parsing, entrypoint behavior, and representative filesystem or delegation behavior are regression tested.
- Tests can call individual shell functions without running an entire maintenance workflow.
- Adding a `.sh` file requires adding its `.bats` peer.
- Contributors on Windows need Git Bash or an explicit compatible Bash path.
- BATS coverage is behavioral and does not provide Vitest-style per-line coverage percentages for shell scripts.

## Related material

- [Code quality standards](../development/code-quality.md#shell-scripts)
- [MCP end-to-end testing guide](../testing/mcp-end-to-end-testing.md#shell-automation-tests)
- [Shell test launcher](../../scripts/run-bats.mjs)
