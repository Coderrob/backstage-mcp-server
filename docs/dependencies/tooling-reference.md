# Dependency tooling reference

## Recommended Yarn 4 commands

| Purpose                                  | Command                                     | Changes files |
| ---------------------------------------- | ------------------------------------------- | ------------- |
| Verify the install and lockfile          | `corepack yarn install --immutable`         | No            |
| Explain all peer requirements            | `corepack yarn explain peer-requirements`   | No            |
| Explain a dependency path                | `corepack yarn why <package>`               | No            |
| Audit direct and transitive dependencies | `corepack yarn npm audit --all --recursive` | No            |
| Check duplicate resolutions              | `corepack yarn dedupe --check`              | No            |
| Upgrade an explicit dependency           | `corepack yarn up <package>@<version>`      | Yes           |
| Interactively select upgrades            | `corepack yarn up <package> --interactive`  | Yes           |
| Apply deduplication                      | `corepack yarn dedupe`                      | Yes           |

Network-backed commands require registry access. Mutating commands must be followed by lockfile review and the verification sequence in the [maintenance guide](maintenance-and-upgrades.md).

## Repository helper scripts

The package currently exposes Bash wrappers around three older helper scripts:

| Script                          | Package commands                                                                                 | Intended responsibility                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `scripts/deps.sh`               | `deps`, `deps:quick`, `deps:update`, `deps:outdated`, `deps:dedupe`, `deps:audit`                | Short dependency operations                 |
| `scripts/dependency-manager.sh` | `deps:analyze`, `deps:check`, `deps:debug`                                                       | Reports, diagnostics, backup-aware analysis |
| `scripts/deps-crossplatform.sh` | `deps:crossplatform`, `deps:backup`, `deps:restore`, `deps:health`, `deps:info`, `deps:validate` | Environment adaptation and delegation       |

Despite its name, `deps-crossplatform.sh` is itself launched through `sh` and `bash`. It adapts commands after Bash starts; it does not make the package scripts executable from native Windows PowerShell.

Each helper has a colocated BATS suite that verifies entrypoint isolation, argument handling, and representative delegated behavior. Run all shell tests with `corepack yarn test:shell`; the cross-platform launcher detects Git for Windows Bash or honors an explicit `BASH_PATH`.

## Current limitations

The helper scripts predate the repository's Yarn 4 configuration. Some paths still invoke Yarn 1 commands that Yarn 4.4.0 does not provide:

- `deps:update` calls `yarn upgrade`;
- `deps:audit` calls `yarn audit`; and
- the comprehensive analysis calls `yarn outdated` and `yarn list`.

Use `yarn up`, `yarn npm audit`, `yarn upgrade-interactive`, `yarn why`, and `yarn explain peer-requirements` as described above. Do not use a helper that deletes or regenerates `yarn.lock` as an automatic recovery step; lockfile replacement is a deliberate, reviewed repository change.

The helpers remain inventoried here because their package scripts still exist. They should be ported to Node.js or updated for Yarn 4 before being treated as supported CI or release gates.

## Troubleshooting

### Immutable install fails

Review the `package.json` and `yarn.lock` diff. If the manifest was intentionally changed, run `corepack yarn install`, inspect the new lockfile, and then rerun `corepack yarn install --immutable`. Do not delete the lockfile merely to suppress the failure.

### Peer dependency warning

Run `corepack yarn explain peer-requirements <hash>` using the `p`-prefixed hash reported by Yarn. Confirm whether the provider version is owned by this package or by an upstream integration before adding a package extension.

### Duplicate resolutions

Run `corepack yarn dedupe --check` first. If deduplication is appropriate, run `corepack yarn dedupe`, review every lockfile change, and execute the complete test suite.

### Build fails after an update

Use the independent gates to localize the failure:

```bash
corepack yarn typecheck
corepack yarn test
corepack yarn build
corepack yarn test:cli
corepack yarn test:inspector
```

Avoid combining dependency upgrades with unrelated source changes; a focused diff makes regressions and transitive changes easier to attribute.
