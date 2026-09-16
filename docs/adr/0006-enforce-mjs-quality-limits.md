# ADR 0006: Enforce strict ECMAScript module quality limits

- Status: Accepted
- Date: 2026-09-15

## Context

Repository automation and protocol verification are implemented as `.mjs` modules. These scripts participate in builds, architecture checks, manifest validation, and end-to-end MCP tests, but previously used the repository's broad complexity limit and advisory function-size rules. The zero-tolerance plugin documents functions but does not enforce class documentation in version 1.2.4.

## Decision

Apply hard ESLint rules to every `.mjs` file:

- cyclomatic complexity below 4;
- no function body longer than 30 lines;
- no file longer than 350 lines;
- JSDoc for every named and anonymous function; and
- JSDoc for every named and anonymous class.

Use named constants in `eslint.config.js` for the numeric limits. Use the zero-tolerance function rules, ESLint's complexity and line rules, and a repository-local ESLint rule for class documentation.

## Consequences

- Automation code follows the same reviewable decomposition standard as runtime code.
- New `.mjs` files inherit the limits without additional configuration.
- Test `.mjs` files do not receive the looser anonymous-function or function-size exceptions used by other unit-test formats.
- Large orchestration functions must be decomposed into documented helpers.
- Changing a limit requires an explicit configuration and documentation update.

## Related material

- [Code quality standards](../development/code-quality.md)
- [MCP verification strategy](0003-mcp-verification-strategy.md)
