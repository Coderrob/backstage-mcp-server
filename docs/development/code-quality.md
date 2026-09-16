# Code quality standards

## ECMAScript modules

Every `.mjs` file is subject to hard ESLint limits:

- cyclomatic complexity must be less than 4 for each function;
- each function body must be no longer than 30 lines;
- each file must be no longer than 350 lines;
- every named or anonymous function must have JSDoc documentation; and
- every named or anonymous class must have an immediately preceding JSDoc block.

The limits apply to all `.mjs` files, including test files. Generated dependencies, build output, and coverage reports are excluded by the repository-wide ESLint ignore policy.

The function documentation rules come from `@coderrob/eslint-plugin-zero-tolerance`. The repository ESLint configuration supplies the class-documentation rule because version 1.2.4 of that plugin does not include one. ESLint's `complexity`, `max-lines-per-function`, and `max-lines` rules provide independent enforcement of the numeric limits. [ADR 0006](../adr/0006-enforce-mjs-quality-limits.md) records this decision.

Run the focused check with:

```bash
corepack yarn eslint "**/*.mjs" --no-warn-ignored
```

The normal `corepack yarn lint` command includes the same rules and is the CI gate.

## Refactoring guidance

When a function exceeds a limit, extract a helper around a cohesive operation rather than suppressing the rule. Keep orchestration functions focused on sequencing, isolate input validation and object construction, and name callbacks when doing so clarifies their responsibility. Every extracted helper receives its own JSDoc contract.

Do not use ESLint disable comments to bypass these standards. If a numeric limit must change, update the named constants in `eslint.config.js`, this document, and the relevant architecture decision in one reviewed change.

## Shell scripts

Every `.sh` file under `scripts` must have a same-name `.bats` test beside it. Shell entrypoints use a `BASH_SOURCE` guard so tests can source functions without triggering command execution, and BATS fixtures isolate all generated files under `BATS_TEST_TMPDIR`.

Run the shell gate with:

```bash
corepack yarn test:shell
```

The architecture check enforces test colocation. [ADR 0007](../adr/0007-test-shell-automation-with-bats.md) records the testing decision.

## Reachability and dependency hygiene

Knip treats the library export surface, CLI, build and lint configurations, and maintained repository runners as entrypoints. Run the unused-code gate with:

```bash
corepack yarn knip
```

The gate reports unused files, exports, dependencies, development dependencies, and undeclared imports. Dependencies reached through resolved executable paths rather than imports are documented as intentional exceptions in `knip.json`. [ADR 0008](../adr/0008-enforce-unused-code-analysis-with-knip.md) records this decision.
