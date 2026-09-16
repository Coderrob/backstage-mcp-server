# Dependency maintenance and upgrades

## Automated updates

Dependabot combines npm/Yarn and GitHub Actions version updates into one `all-dependencies` pull request every Monday at 09:00 America/Chicago. Both ecosystems have a 12-day default cooldown. npm major updates wait 30 days, minor updates wait 12 days, and patch updates wait 7 days. GitHub does not apply cooldowns to security updates, so vulnerability remediation is not delayed.

The configuration lives in [`.github/dependabot.yml`](../../.github/dependabot.yml). Add a new `updates` entry to the same multi-ecosystem group when the repository adopts another supported package ecosystem. Dependabot minor and patch pull requests are eligible for squash auto-merge only after required branch-protection checks pass; major and unclassified grouped updates always require manual review.

## Node.js and package-manager policy

Node.js 24 is the minimum supported runtime and the only major exercised by CI and release automation. The package `engines` field declares the consumer floor, while `.nvmrc` and `.node-version` select the same major for common development tools. TypeScript emits ES2024 syntax because older Node.js releases are outside the supported range.

Yarn is pinned through the `packageManager` field. CI and release workflows activate that exact version with Corepack and install with `--immutable`; do not use floating `yarn@4` activation or the legacy `--frozen-lockfile` spelling.

## Version policy

Choose dependency ranges deliberately:

- Use explicit compatible ranges in `package.json` and let `yarn.lock` provide reproducible exact resolutions. Pin a direct dependency only when its compatibility or release behavior requires a narrower policy.
- Use compatible ranges for mature build and utility dependencies when routine updates are expected.
- Treat every major update as a compatibility change and review its migration guidance.
- Do not apply security updates blindly. Assess whether the advisory affects a reachable production path, then upgrade or document a narrowly scoped exception.

The checked-in manifest and lockfile are the authoritative versions. Avoid copying version numbers into general documentation.

## Upgrade procedure

1. Begin from a reviewed worktree and verify the existing lockfile:

   ```bash
   corepack yarn install --immutable
   ```

2. Inspect why the package is present and review peer requirements:

   ```bash
   corepack yarn why <package>
   corepack yarn explain peer-requirements
   ```

3. Upgrade an explicit package to an explicit version. Use interactive mode when choosing among multiple upgrade paths:

   ```bash
   corepack yarn up <package>@<version>
   corepack yarn up <package> --interactive
   ```

4. Review both `package.json` and `yarn.lock`. Unexpected packages, registry changes, checksum changes, or broad transitive churn require investigation.

5. Check whether the new resolution can be deduplicated:

   ```bash
   corepack yarn dedupe --check
   ```

   Run `corepack yarn dedupe` only when you intend to modify the lockfile, then review and test the resulting upgrades.

6. Run the repository verification gates:

   ```bash
   corepack yarn lint
   corepack yarn typecheck
   corepack yarn architecture:check
   corepack yarn knip
   corepack yarn test
   corepack yarn test:shell
   corepack yarn test:mcp
   corepack yarn manifest:check
   ```

The MCP-specific gate builds the published artifacts and exercises the packaged stdio CLI through both the official SDK client and MCP Inspector. See the [MCP end-to-end testing guide](../testing/mcp-end-to-end-testing.md) for the precise boundary.

## Release policy

Tag releases must match the `v<package-version>` form exactly. The release workflow repeats every lint, type, architecture, unused-code, unit, shell, build, manifest, and MCP protocol gate before publishing. npm publication includes provenance, and the GitHub release is created with generated notes only after publication succeeds.

All GitHub Actions are pinned to full commit SHAs with version comments. Dependabot maintains those immutable pins through the `github-actions` ecosystem.

## Security review

Audit direct and transitive dependencies with:

```bash
corepack yarn npm audit --all --recursive
```

A nonzero result requires triage, not an unreviewed bulk update. For each relevant advisory:

1. identify the dependency path with `corepack yarn why <package>`;
2. determine whether the affected behavior is reachable in production;
3. prefer the smallest compatible direct or transitive upgrade;
4. rerun all verification gates; and
5. document any temporary exception with its advisory identifier, rationale, owner, and removal condition.

## Integration-sensitive updates

For MCP SDK or Inspector changes, rerun the in-memory contracts, built CLI smoke test, and Inspector validation. SDK registration changes should remain isolated to `src/mcp/sdk-adapter.ts`.

For Backstage changes, review the official client API compatibility notes and rerun the adapter and plugin suites. The supported packages and endpoint behavior are recorded in the [Backstage Catalog integration guide](../integrations/backstage-catalog.md) and [ADR 0004](../adr/0004-official-backstage-catalog-client.md).
