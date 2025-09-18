# Dependency Management Guide

This document provides comprehensive guidance on managing dependencies in the Backstage MCP Server project.

## Overview

The project includes several tools and scripts for dependency management:

1. **Comprehensive Analysis**: `scripts/dependency-manager.sh` - Enterprise-grade dependency analysis
2. **Quick Operations**: `scripts/deps.sh` - Simple helper for common tasks
3. **Package Scripts**: Convenient yarn/npm commands for all operations

## Quick Start

### Immediate Health Check

```bash
# Quick peer dependency check
yarn deps:quick

# Full dependency analysis
yarn deps:analyze

# Check for outdated packages
yarn deps:outdated
```

### Common Maintenance Tasks

```bash
# Security audit
yarn deps:audit

# Remove duplicate dependencies
yarn deps:dedupe

# Safe patch-level updates
yarn deps:update
```

## Scripts Reference

### 1. Quick Helper (`scripts/deps.sh`)

Simple script for common dependency operations:

| Command    | Description                   | Example              |
| ---------- | ----------------------------- | -------------------- |
| `check`    | Quick peer dependency check   | `yarn deps:quick`    |
| `update`   | Safe patch-level updates only | `yarn deps:update`   |
| `outdated` | Show outdated packages        | `yarn deps:outdated` |
| `dedupe`   | Remove duplicate dependencies | `yarn deps:dedupe`   |
| `audit`    | Security vulnerability scan   | `yarn deps:audit`    |
| `analyze`  | Run full dependency analysis  | `yarn deps:analyze`  |

### 2. Comprehensive Manager (`scripts/dependency-manager.sh`)

Enterprise-grade dependency analysis with advanced features:

| Option      | Description                    | Example                                     |
| ----------- | ------------------------------ | ------------------------------------------- |
| `--dry-run` | Analyze without making changes | `yarn deps:check`                           |
| `--debug`   | Verbose debugging output       | `yarn deps:debug`                           |
| `--backup`  | Create dependency backup       | `./scripts/dependency-manager.sh --backup`  |
| `--restore` | Restore from backup            | `./scripts/dependency-manager.sh --restore` |

## Package Scripts Available

```json
{
  "deps": "bash scripts/deps.sh", // Show help
  "deps:analyze": "bash scripts/dependency-manager.sh",
  "deps:audit": "bash scripts/deps.sh audit",
  "deps:check": "bash scripts/dependency-manager.sh --dry-run",
  "deps:debug": "bash scripts/dependency-manager.sh --debug",
  "deps:dedupe": "bash scripts/deps.sh dedupe",
  "deps:outdated": "bash scripts/deps.sh outdated",
  "deps:quick": "bash scripts/deps.sh check",
  "deps:update": "bash scripts/deps.sh update"
}
```

## Dependency Strategy

### Stable Version Matrix

The project maintains compatibility with these stable versions:

| Package                 | Version   | Reason                                        |
| ----------------------- | --------- | --------------------------------------------- |
| `@rollup/plugin-terser` | `^0.4.4`  | Official Rollup v4 compatibility              |
| `rollup`                | `^4.50.2` | Latest stable with ESM/CJS support            |
| `rollup-plugin-dts`     | `^6.2.3`  | TypeScript declaration bundling               |
| `typescript`            | `^5.9.2`  | Stable release with full feature set          |
| `yarn`                  | `4.4.0`   | Modern package manager with workspace support |

### Update Policy

1. **Patch Updates**: Safe to apply automatically (`yarn deps:update`)
2. **Minor Updates**: Review breaking changes before applying
3. **Major Updates**: Test thoroughly in development environment
4. **Security Updates**: Apply immediately regardless of version

### Peer Dependency Resolution

Common peer dependency conflicts and solutions:

```bash
# Check for conflicts
yarn deps:quick

# Full conflict analysis
yarn deps:analyze --debug

# View peer dependency tree
yarn why [package-name]
```

## Build System Integration

The dependency management integrates with the Rollup build system:

### External Dependencies

- All `@backstage/*` packages are marked as external
- Peer dependencies are automatically excluded from bundles
- Warning suppression for external dependency resolution

### Declaration Bundling

- Single `dist/index.d.ts` file generated from all TypeScript declarations
- External type references preserved for consumer compatibility

## Troubleshooting

### Common Issues

1. **Peer Dependency Warnings**

   ```bash
   yarn deps:quick  # Check for conflicts
   yarn deps:analyze --debug  # Detailed analysis
   ```

2. **Outdated Packages**

   ```bash
   yarn deps:outdated  # Show what's outdated
   yarn deps:update    # Safe patch updates
   ```

3. **Security Vulnerabilities**

   ```bash
   yarn deps:audit     # Security scan
   yarn audit --fix    # Auto-fix if available
   ```

4. **Duplicate Dependencies**

   ```bash
   yarn deps:dedupe    # Remove duplicates
   ```

5. **Build Issues**

   ```bash
   yarn clean && yarn build  # Clean rebuild
   yarn validate:build       # Validate output
   ```

### Debug Information

For detailed debugging information:

```bash
# Full debug output
yarn deps:debug

# Environment validation
yarn deps:analyze --backup  # Also creates environment snapshot
```

## File Locations

- **Main Scripts**: `scripts/dependency-manager.sh`, `scripts/deps.sh`
- **Configuration**: `package.json`, `yarn.lock`
- **Build Config**: `rollup.config.js`
- **Documentation**: `BUILD_SETUP.md`, this file

## Best Practices

1. **Regular Maintenance**
   - Run `yarn deps:quick` before major development sessions
   - Schedule weekly `yarn deps:outdated` reviews
   - Monthly security audits with `yarn deps:audit`

2. **Before Releases**
   - Full dependency analysis: `yarn deps:analyze`
   - Security audit: `yarn deps:audit`
   - Build validation: `yarn validate:build`

3. **Development Workflow**
   - Use `yarn deps:update` for safe updates
   - Test thoroughly after any dependency changes
   - Keep peer dependencies aligned with target Backstage versions

4. **Monitoring**
   - Set up automated dependency scanning in CI/CD
   - Monitor security advisories for used packages
   - Track update patterns for major dependencies

---

_This guide is part of the comprehensive dependency management system. For technical details, see the individual script files and `BUILD_SETUP.md`._
