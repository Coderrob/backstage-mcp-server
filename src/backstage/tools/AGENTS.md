# Backstage MCP tool conventions

This directory contains the Backstage Catalog tool surface exposed over MCP. Keep each tool independently understandable, testable, and composable.

## Module structure

- Define exactly one MCP tool in each `<tool_name>.tool.ts` module using `defineTool<BackstageMcpContext>()`.
- Export the tool definition as a named `camelCaseTool` constant. Do not use decorators, reflection, mutable registration, or class wrappers.
- Keep `backstage.plugin.ts` limited to plugin metadata and composition of the tool definitions exported by this directory.
- Put reusable schemas, policies, reference conversion, response construction, and Catalog error mapping in `shared.ts`. Do not duplicate these concerns in individual tools.
- Register every supported tool in `index.ts`; preserve a deterministic alphabetical order by MCP tool name.

## Definition requirements

- Give every tool a stable snake_case `name`, concise `title` and `description`, Zod `inputSchema`, structured `outputSchema`, MCP annotations, and an execution policy.
- Select the tool `name` from `BackstageToolName` in `../../shared/constants/backstage-catalog.ts`; do not repeat protocol identifiers as string literals.
- Infer handler inputs from the Zod schema. Avoid parallel handwritten input types and unsafe casts.
- Use the official Backstage Catalog client through `BackstageMcpContext`; do not reimplement Catalog HTTP routes in tool modules.
- Mark mutations accurately. Destructive tools must use destructive annotations, and all mutations must invalidate the `catalog` cache tag.
- Convert structured entity references with the shared helper and map upstream errors through the shared Catalog result helpers.
- Add JSDoc to every function, method, class, and callback required by the repository lint policy. Document handler behavior, parameters, results, and material error cases.

## Testing and verification

- Add a colocated `<tool_name>.tool.test.ts` for every tool module and a colocated test for every other behavioral TypeScript module in this directory.
- Test the tool's metadata and schema plus meaningful handler behavior, including argument forwarding and relevant failure or not-found behavior.
- Maintain at least 95% statement, branch, function, and line coverage for every file, not only the aggregate suite.
- Update plugin contract tests, CLI/Inspector expected tool lists, the generated MCP manifest, and user documentation whenever the registered tool surface changes.
- Before completion, run formatting/lint, type checking, architecture checks, unit coverage, Knip, manifest verification, and the MCP end-to-end suite.
