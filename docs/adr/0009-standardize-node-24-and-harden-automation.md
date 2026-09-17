# ADR 0009: Standardize Node.js 24 and harden dependency and release automation

- Status: Accepted
- Date: 2026-09-15

## Context

Development documentation and CI used Node.js 22.19, while release automation still used Node.js 20. The workflows floated the Yarn 4 minor version, used legacy immutable-install syntax, referenced mutable action tags, and ran different verification gates before merge and publication. The release workflow also depended on the obsolete `actions/create-release` action.

Dependency updates were grouped across npm/Yarn and GitHub Actions with a uniform cooldown, but had no predictable weekday or time and no guarded automation for low-risk changes.

## Decision

- Require Node.js 24 or newer through package metadata and developer version files.
- Exercise Node.js 24 in CI and release automation and emit ES2024 output.
- Pin Yarn exactly through `packageManager` and use immutable installs.
- Pin every GitHub Action to a full commit SHA while retaining a readable release comment.
- Run the complete repository and packaged MCP verification suite before publication.
- Require the release tag to match the package version, publish npm provenance, and create GitHub releases with the preinstalled GitHub CLI.
- Review high-severity dependency changes in pull requests.
- Schedule grouped dependency updates at a predictable weekly time, retain immediate security updates, and use longer cooldowns for npm majors than for patches.
- Permit auto-merge only when Dependabot classifies an update as minor or patch; branch protection remains the authority that decides when the merge may complete.

## Consequences

- Consumers on Node.js 22 and earlier must upgrade before using new releases.
- CI, release, local version selectors, compiler output, and package metadata share one runtime floor.
- Immutable action pins reduce tag-retargeting risk but make Dependabot's GitHub Actions updates essential.
- Release execution takes longer because it repeats all quality and protocol gates before publishing.
- Auto-merge requires the repository's GitHub setting to allow auto-merge and effective required status checks on the default branch.
- Cross-ecosystem major updates remain grouped to honor the repository's low-noise update policy, so those pull requests require careful manual review.

## Related material

- [Dependency maintenance and upgrades](../dependencies/maintenance-and-upgrades.md)
- [Continuous integration workflow](../../.github/workflows/ci.yml)
- [Release workflow](../../.github/workflows/release.yml)
- [Dependabot configuration](../../.github/dependabot.yml)
