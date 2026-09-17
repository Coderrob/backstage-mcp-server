# Repository engineering conventions

## Contract ownership

- Declare reusable TypeScript interfaces and type aliases in the cohesively named module under `src/types`; export them through `src/types/index.ts` when they are part of the supported integration surface.
- Do not declare interfaces or type aliases in unit test files. Tests must consume the same named contracts as production and integration code. Put genuinely test-only contracts in a cohesively named declaration-only module under `src/types` rather than embedding them in a test.
- Do not use type assertions or double casts in tests, including `as unknown as`, `as never`, and `as const`. Validate unknown runtime data with a type guard or schema, and construct test doubles that satisfy their real contract.
- Do not extract collaborator method types with indexed-access expressions such as `Service['method']`. Export a named function contract and use that contract in both the owning interface and its tests.
- Prefer `satisfies` when validating an object literal while preserving its inferred concrete type. `satisfies` must not be used to compensate for a missing named integration contract.

## Test quality

- Keep tests colocated with the module under test and maintain at least 95% statement, branch, function, and line coverage per production file.
- Do not add inline ESLint suppressions or test-specific safety-rule exceptions. Fix the fixture, contract, or implementation that causes the violation.
- Test doubles must implement the complete relevant contract so newly required fields and methods fail type checking instead of being hidden.
- Before completion, run linting, production and test type checking, unit coverage, architecture checks, Knip, manifest verification, shell tests, and MCP end-to-end tests applicable to the change.
