# Code quality standards

The repository applies strict, type-aware linting to production TypeScript and equivalent documentation and maintainability expectations to executable JavaScript modules. Unit tests keep correctness rules while relaxing only the constraints that would make test setup unnecessarily indirect.

## TypeScript modules

Every production `.ts` file under `src` is checked with TypeScript ESLint's strict type-aware rules, import validation and sorting, unused-import detection, SonarJS maintainability rules, JSDoc, and the zero-tolerance plugin.

- Production functions are limited to 30 lines by both ESLint and zero-tolerance enforcement.
- Functions, callbacks, and classes require JSDoc according to the configured repository rules.
- Explicit `any`, missing modules, unused imports, and missing function return types are rejected by lint or TypeScript.
- Production and test sources are typechecked through separate TypeScript projects.

Colocated `.test.ts` and `.spec.ts` files retain strict typing, imports, class documentation, and maintainability checks. They intentionally disable result-return preference, anonymous-function JSDoc, and maximum function size so setup and assertions can remain readable.

## ECMAScript modules

Every production `.mjs` file is subject to hard ESLint limits:

- cyclomatic complexity must be less than 4 for each function;
- each function body must be no longer than 30 lines;
- each file must be no longer than 350 lines;
- every named or anonymous function must have JSDoc documentation; and
- every named or anonymous class must have an immediately preceding JSDoc block.

`.test.mjs` and `.spec.mjs` files retain the cyclomatic-complexity and named-function documentation rules but disable maximum file size, maximum function size, anonymous-function JSDoc, and result-return preference. Generated dependencies, build output, and coverage reports are excluded by the repository-wide ESLint ignore policy.

The function documentation rules come from `@coderrob/eslint-plugin-zero-tolerance`. The repository ESLint configuration supplies an explicit class-documentation rule. ESLint's `complexity`, `max-lines-per-function`, and `max-lines` rules provide independent enforcement of the numeric limits. [ADR 0006](../adr/0006-enforce-mjs-quality-limits.md) records the ECMAScript-module decision.

Run the focused check with:

```bash
corepack yarn eslint "**/*.mjs" --no-warn-ignored
```

The normal `corepack yarn lint` command includes TypeScript, JavaScript, `.mjs`, and `.cjs` files and is the CI gate.

## Tests and coverage

Every behavioral production TypeScript module must have a side-by-side test with the same file stem. `architecture:check` enforces colocation, while Vitest and V8 require at least 95% statements, branches, functions, and lines for each production file. Type-only modules under `src/types` are exempt because they emit no runtime behavior.

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
