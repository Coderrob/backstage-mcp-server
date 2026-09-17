# Dependency management

This repository uses the Yarn version declared by the `packageManager` field in [`package.json`](../../package.json). Run Yarn through Corepack so local and CI behavior use the same release.

## Supported workflow

From the repository root:

```bash
corepack yarn install --immutable
corepack yarn explain peer-requirements
corepack yarn dedupe --check
corepack yarn npm audit --all --recursive
```

These commands respectively verify the lockfile installation, explain peer requirements, detect duplicate resolutions without changing the lockfile, and audit direct and transitive dependencies.

Use the following documents for the rest of the workflow:

- [Maintenance and upgrade policy](maintenance-and-upgrades.md) explains version changes, lockfile review, security handling, and required verification.
- [Dependency tooling reference](tooling-reference.md) inventories the repository helpers, their side effects, platform requirements, and current limitations.

## Sources of truth

- [`package.json`](../../package.json) defines direct runtime and development dependencies, package scripts, and the Yarn release.
- [`yarn.lock`](../../yarn.lock) pins the resolved dependency graph.
- [`.yarnrc.yml`](../../.yarnrc.yml) defines the node-modules linker and documented package extensions.

Do not document a second static "current versions" table. It becomes stale independently of `package.json`. Integration-specific compatibility decisions belong with their integration documentation, such as the [Backstage Catalog integration](../integrations/backstage-catalog.md).

## Platform note

Core Yarn commands are portable across the supported Node.js environments. The scripts under `scripts/*.sh` require Bash and Unix-style utilities. On Windows, run those helpers from Git Bash or WSL; native PowerShell cannot execute the current package-script wrappers. Prefer the direct Corepack commands above when a Bash environment is unavailable.
