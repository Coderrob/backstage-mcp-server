#!/usr/bin/env bash

# =============================================================================
# Dependency Helper Script
# =============================================================================
#
# Quick commands for common dependency management tasks.
# This script provides simple shortcuts for the most common operations.
#
# Author: GitHub Copilot
# Version: 1.0.0
# =============================================================================

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Quick check for peer dependency issues
quick_check() {
    echo -e "${BLUE}=== Quick Dependency Check ===${NC}"

    cd "$PROJECT_ROOT"

    # Check for yarn vs npm
    if command -v yarn >/dev/null 2>&1; then
        log "Using Yarn for dependency management"
        local conflicts
        conflicts=$(yarn install 2>&1 | grep -E "(YN0060|YN0086)" || true)

        if [[ -n "$conflicts" ]]; then
            warn "Peer dependency issues detected:"
            echo "$conflicts"
            return 1
        else
            log "✅ No peer dependency conflicts found"
        fi
    else
        log "Using NPM for dependency management"
        npm install --dry-run 2>&1 | grep -E "peer.*WARN|ERESOLVE" || log "✅ No peer dependency conflicts found"
    fi
}

# Update safe dependencies (patch versions only)
update_safe() {
    echo -e "${BLUE}=== Safe Dependency Updates ===${NC}"

    cd "$PROJECT_ROOT"

    if command -v yarn >/dev/null 2>&1; then
        log "Updating patch-level dependencies with Yarn..."
        yarn upgrade --pattern "*" --patch
    else
        log "Updating patch-level dependencies with NPM..."
        npx npm-check-updates --target patch --upgrade
        npm install
    fi

    log "✅ Safe updates complete"
}

# Check outdated packages
check_outdated() {
    echo -e "${BLUE}=== Outdated Package Check ===${NC}"

    cd "$PROJECT_ROOT"

    if command -v yarn >/dev/null 2>&1; then
        # Check yarn version to use appropriate command
        local yarn_version
        yarn_version=$(yarn --version)
        if [[ "$yarn_version" =~ ^4\. ]]; then
            log "Using Yarn v4 - checking for outdated packages..."
            yarn upgrade-interactive || true
        else
            yarn outdated || true
        fi
    else
        npm outdated || true
    fi
}

# Deduplicate dependencies
deduplicate() {
    echo -e "${BLUE}=== Dependency Deduplication ===${NC}"

    cd "$PROJECT_ROOT"

    if command -v yarn >/dev/null 2>&1; then
        log "Running yarn dedupe..."
        yarn dedupe
    else
        log "Running npm dedupe..."
        npm dedupe
    fi

    log "✅ Deduplication complete"
}

# Security audit
security_audit() {
    echo -e "${BLUE}=== Security Audit ===${NC}"

    cd "$PROJECT_ROOT"

    if command -v yarn >/dev/null 2>&1; then
        yarn audit || warn "Security vulnerabilities found - review output above"
    else
        npm audit || warn "Security vulnerabilities found - review output above"
    fi
}

# Full analysis using the main script
full_analysis() {
    echo -e "${BLUE}=== Full Dependency Analysis ===${NC}"

    if [[ -x "$SCRIPT_DIR/dependency-manager.sh" ]]; then
        "$SCRIPT_DIR/dependency-manager.sh" "$@"
    else
        error "dependency-manager.sh not found or not executable"
        exit 1
    fi
}

# Show help
show_help() {
    cat << EOF
Dependency Helper v1.0.0

USAGE:
    $0 <command> [options]

COMMANDS:
    check          Quick check for peer dependency conflicts
    update         Update dependencies safely (patch versions only)
    outdated       Show outdated packages
    dedupe         Remove duplicate dependencies
    audit          Run security audit
    analyze        Run full dependency analysis
    help           Show this help

EXAMPLES:
    $0 check                    # Quick peer dependency check
    $0 update                   # Safe patch-level updates
    $0 analyze --debug          # Full analysis with debug output
    $0 audit                    # Security vulnerability check

EOF
}

# Main command dispatcher
main() {
    case "${1:-help}" in
        check|c)
            shift
            quick_check "$@"
            ;;
        update|u)
            shift
            update_safe "$@"
            ;;
        outdated|o)
            shift
            check_outdated "$@"
            ;;
        dedupe|d)
            shift
            deduplicate "$@"
            ;;
        audit|a)
            shift
            security_audit "$@"
            ;;
        analyze|full)
            shift
            full_analysis "$@"
            ;;
        help|h|-h|--help)
            show_help
            ;;
        *)
            error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
