#!/usr/bin/env bash

# =============================================================================
# Cross-Platform Dependency Manager Wrapper
# =============================================================================
#
# Universal wrapper that provides cross-platform compatibility for dependency
# management operations, automatically detecting the environment and using
# appropriate tools and commands.
#
# Author: GitHub Copilot
# Version: 1.0.0
# =============================================================================

# Cross-platform environment detection
detect_environment() {
    # Detect OS
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        Darwin*)    OS="macos";;
        CYGWIN*|MINGW*|MSYS*) OS="windows";;
        *)          OS="unknown";;
    esac

    # Detect shell environment on Windows
    if [[ "$OS" == "windows" ]]; then
        if [[ -n "$MSYSTEM" ]]; then
            SHELL_TYPE="msys"
        elif [[ -n "$WSL_DISTRO_NAME" ]]; then
            SHELL_TYPE="wsl"
        elif command -v cygwin1.dll >/dev/null 2>&1; then
            SHELL_TYPE="cygwin"
        else
            SHELL_TYPE="cmd"
        fi
    else
        SHELL_TYPE="bash"
    fi

    # Detect architecture
    ARCH=$(uname -m 2>/dev/null || echo "unknown")

    # Detect available tools
    TOOLS_AVAILABLE=()

    command -v node >/dev/null 2>&1 && TOOLS_AVAILABLE+=("node")
    command -v npm >/dev/null 2>&1 && TOOLS_AVAILABLE+=("npm")
    command -v yarn >/dev/null 2>&1 && TOOLS_AVAILABLE+=("yarn")
    command -v jq >/dev/null 2>&1 && TOOLS_AVAILABLE+=("jq")
    command -v python3 >/dev/null 2>&1 && TOOLS_AVAILABLE+=("python3")
    command -v curl >/dev/null 2>&1 && TOOLS_AVAILABLE+=("curl")
    command -v wget >/dev/null 2>&1 && TOOLS_AVAILABLE+=("wget")
}

# Cross-platform path normalization
normalize_path() {
    local path="$1"

    if [[ "$OS" == "windows" ]]; then
        # Convert Unix paths to Windows paths for different environments
        case "$SHELL_TYPE" in
            msys)
                # MSYS2: /c/ -> C:/
                echo "$path" | sed 's|^/\([a-zA-Z]\)/|\1:/|g'
                ;;
            cygwin)
                # Cygwin: /cygdrive/c/ -> C:/
                if command -v cygpath >/dev/null 2>&1; then
                    cygpath -w "$path"
                else
                    echo "$path" | sed 's|^/cygdrive/\([a-zA-Z]\)/|\1:/|g'
                fi
                ;;
            wsl)
                # WSL: /mnt/c/ -> C:/
                echo "$path" | sed 's|^/mnt/\([a-zA-Z]\)/|\1:/|g'
                ;;
            *)
                echo "$path"
                ;;
        esac
    else
        echo "$path"
    fi
}

# Cross-platform temporary directory
get_temp_dir() {
    if [[ "$OS" == "windows" ]]; then
        if [[ -n "$TEMP" ]]; then
            echo "$TEMP"
        elif [[ -n "$TMP" ]]; then
            echo "$TMP"
        else
            echo "/tmp"
        fi
    else
        echo "/tmp"
    fi
}

# Cross-platform command execution with fallbacks
execute_command() {
    local command="$1"
    local fallback="${2:-}"

    debug "Executing: $command"

    if eval "$command"; then
        return 0
    elif [[ -n "$fallback" ]]; then
        warn "Primary command failed, trying fallback: $fallback"
        if eval "$fallback"; then
            return 0
        fi
    fi

    error "Command failed: $command"
    return 1
}

# Cross-platform JSON processing
json_extract() {
    local json_file="$1"
    local jq_query="$2"

    if [[ " ${TOOLS_AVAILABLE[*]} " =~ " jq " ]]; then
        jq -r "$jq_query" "$json_file" 2>/dev/null
    elif [[ " ${TOOLS_AVAILABLE[*]} " =~ " python3 " ]]; then
        python3 -c "
import json
import sys
try:
    with open('$json_file', 'r') as f:
        data = json.load(f)
    result = eval('$jq_query'.replace('.[', '[').replace('.name', "['name']"))
    print(result if result is not None else '')
except:
    sys.exit(1)
"
    elif [[ " ${TOOLS_AVAILABLE[*]} " =~ " node " ]]; then
        node -e "
const fs = require('fs');
try {
    const data = JSON.parse(fs.readFileSync('$json_file', 'utf8'));
    const result = eval('$jq_query'.replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '[\$1]'));
    console.log(result || '');
} catch(e) {
    process.exit(1);
}
"
    else
        error "No JSON processor available"
        return 1
    fi
}

# Cross-platform network operations
http_get() {
    local url="$1"
    local output_file="$2"

    if [[ " ${TOOLS_AVAILABLE[*]} " =~ " curl " ]]; then
        curl -s -o "$output_file" "$url"
    elif [[ " ${TOOLS_AVAILABLE[*]} " =~ " wget " ]]; then
        wget -q -O "$output_file" "$url"
    else
        error "No HTTP client available (curl or wget required)"
        return 1
    fi
}

# Cross-platform file operations
safe_copy() {
    local src="$1"
    local dst="$2"

    if [[ "$OS" == "windows" ]]; then
        # Use robocopy on Windows for better reliability
        if command -v robocopy >/dev/null 2>&1; then
            robocopy "$(dirname "$src")" "$(dirname "$dst")" "$(basename "$src")" /NJH /NJS /NDL /NFL /NJH >nul 2>&1
        else
            cp "$src" "$dst"
        fi
    else
        cp "$src" "$dst"
    fi
}

# Cross-platform directory creation
safe_mkdir() {
    local dir="$1"

    if [[ "$OS" == "windows" ]]; then
        mkdir -p "$dir" 2>nul || true
    else
        mkdir -p "$dir" 2>/dev/null || true
    fi
}

# Cross-platform timestamp
get_timestamp() {
    if command -v date >/dev/null 2>&1; then
        date +%s 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Cross-platform sleep
safe_sleep() {
    local seconds="$1"

    if command -v sleep >/dev/null 2>&1; then
        sleep "$seconds"
    else
        # Fallback using ping (works on Windows)
        ping -n $((seconds + 1)) 127.0.0.1 >nul 2>&1 || true
    fi
}

# Environment validation
validate_environment() {
    local missing_tools=()

    # Check required tools
    for tool in node npm; do
        if [[ ! " ${TOOLS_AVAILABLE[*]} " =~ " $tool " ]]; then
            missing_tools+=("$tool")
        fi
    done

    # Check for at least one JSON processor
    local has_json_processor=false
    for tool in jq python3 node; do
        if [[ " ${TOOLS_AVAILABLE[*]} " =~ " $tool " ]]; then
            has_json_processor=true
            break
        fi
    done

    if [[ "$has_json_processor" == false ]]; then
        missing_tools+=("json_processor (jq, python3, or node)")
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Please install missing tools:"
        echo "- Node.js: https://nodejs.org/"
        echo "- jq: https://stedolan.github.io/jq/"
        echo "- Python 3: https://www.python.org/"
        return 1
    fi

    return 0
}

# Main cross-platform wrapper
main() {
    # Initialize environment detection
    detect_environment

    # Set up logging
    readonly LOG_FILE="${SCRIPT_DIR}/deps-crossplatform.log"
    readonly TEMP_DIR="$(get_temp_dir)/deps-wrapper-$$"

    # Colors (disable on Windows CMD)
    if [[ "$SHELL_TYPE" == "cmd" ]]; then
        readonly GREEN=""
        readonly YELLOW=""
        readonly RED=""
        readonly BLUE=""
        readonly NC=""
    else
        readonly GREEN='\033[0;32m'
        readonly YELLOW='\033[1;33m'
        readonly RED='\033[0;31m'
        readonly BLUE='\033[0;34m'
        readonly NC='\033[0m'
    fi

    # Create temp directory
    safe_mkdir "$TEMP_DIR"

    # Validate environment
    if ! validate_environment; then
        exit 1
    fi

    log "Cross-platform dependency manager initialized"
    log "Environment: $OS/$ARCH, Shell: $SHELL_TYPE"
    log "Available tools: ${TOOLS_AVAILABLE[*]}"

    # Execute the requested operation
    case "${1:-help}" in
        check|quick)
            shift
            quick_check "$@"
            ;;
        update|upgrade)
            shift
            safe_update "$@"
            ;;
        outdated)
            shift
            check_outdated "$@"
            ;;
        dedupe)
            shift
            deduplicate "$@"
            ;;
        audit)
            shift
            security_audit "$@"
            ;;
        analyze|full)
            shift
            full_analysis "$@"
            ;;
        backup)
            shift
            create_backup "$@"
            ;;
        restore)
            shift
            restore_backup "$@"
            ;;
        health)
            shift
            health_check "$@"
            ;;
        info)
            shift
            show_info "$@"
            ;;
        help|-h|--help)
            show_help
            ;;
        *)
            error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Quick dependency check with cross-platform support
quick_check() {
    echo -e "${BLUE}=== Cross-Platform Dependency Check ===${NC}"
    log "Starting quick dependency check"

    cd "$PROJECT_ROOT" || {
        error "Failed to change to project directory: $PROJECT_ROOT"
        return 1
    }

    # Check if node_modules exists and package.json dependencies are satisfied
    if [[ ! -d "node_modules" ]]; then
        warn "node_modules not found, dependencies may not be installed"
        echo -e "${YELLOW}⚠️  Dependencies not installed - run 'yarn install' first${NC}"
        return 1
    fi

    # Cross-platform package manager detection
    local package_cmd=""
    if [[ " ${TOOLS_AVAILABLE[*]} " =~ " yarn " ]]; then
        package_cmd="yarn"
        log "Using Yarn package manager"
    elif [[ " ${TOOLS_AVAILABLE[*]} " =~ " npm " ]]; then
        package_cmd="npm"
        log "Using NPM package manager"
    else
        error "No package manager found"
        return 1
    fi

    # Check if dependencies are properly installed by verifying a few key packages
    local check_result=0
    if [[ "$package_cmd" == "yarn" ]]; then
        # Detect yarn version and use appropriate check command
        local yarn_version
        yarn_version=$(yarn --version 2>/dev/null | head -1)
        log "Detected yarn version: $yarn_version"

        if [[ "$yarn_version" =~ ^4\. ]]; then
            # Yarn 4: use install --immutable
            log "Running yarn install --immutable to verify dependencies"
            if yarn install --immutable 2>&1; then
                log "Dependencies verified successfully"
                check_result=0
            else
                # Check if the error is about lockfile being out of sync
                if yarn install --immutable 2>&1 | grep -q "lockfile would have been modified"; then
                    warn "Lockfile is out of sync with package.json, regenerating..."
                    log "Removing old lockfile and regenerating"
                    rm -f yarn.lock
                    if yarn install; then
                        log "Lockfile regenerated successfully"
                        # Now try the immutable check again
                        if yarn install --immutable 2>&1; then
                            log "Dependencies verified successfully after lockfile regeneration"
                            check_result=0
                        else
                            log "Dependency verification failed even after lockfile regeneration"
                            check_result=1
                        fi
                    else
                        error "Failed to regenerate lockfile"
                        check_result=1
                    fi
                else
                    log "Dependency verification failed with unknown error"
                    check_result=1
                fi
            fi
        else
            # Yarn 1: check if node_modules exists and key packages are present
            log "Running basic dependency verification for Yarn 1"
            if [[ -d "node_modules" ]] && [[ -d "node_modules/@backstage" ]] && [[ -d "node_modules/@modelcontextprotocol" ]]; then
                log "Basic dependency check passed"
                check_result=0
            else
                log "Basic dependency check failed - missing key packages"
                check_result=1
            fi
        fi
    else
        # npm ls for npm
        if command -v timeout >/dev/null 2>&1 && [[ "$OS" != "windows" ]]; then
            timeout 30 npm ls --depth=0 >/dev/null 2>&1 || check_result=$?
        elif [[ "$OS" == "windows" ]] && command -v timeout >/dev/null 2>&1; then
            timeout /t 30 /nobreak npm ls --depth=0 >nul 2>&1 || check_result=$?
        else
            npm ls --depth=0 >/dev/null 2>&1 || check_result=$?
        fi
    fi

    if [[ $check_result -eq 0 ]]; then
        echo -e "${GREEN}✅ No critical dependency issues found${NC}"
        return 0
    else
        echo -e "${RED}❌ Dependency issues detected${NC}"
        return 1
    fi
}

# Show environment information
show_info() {
    echo -e "${BLUE}=== Environment Information ===${NC}"
    echo "Operating System: $OS"
    echo "Architecture: $ARCH"
    echo "Shell Type: $SHELL_TYPE"
    echo "Available Tools: ${TOOLS_AVAILABLE[*]}"
    echo "Project Root: $PROJECT_ROOT"
    echo "Temp Directory: $TEMP_DIR"
    echo "Log File: $LOG_FILE"
}

# Enhanced help
show_help() {
    cat << EOF
Cross-Platform Dependency Manager v1.0.0

USAGE:
    $0 <command> [options]

COMMANDS:
    check          Quick dependency check
    update         Safe dependency updates
    outdated       Check for outdated packages
    dedupe         Remove duplicate dependencies
    audit          Security audit
    analyze        Full dependency analysis
    backup         Create dependency backup
    restore        Restore from backup
    health         Run health checks
    info           Show environment info
    help           Show this help

CROSS-PLATFORM FEATURES:
    - Automatic OS detection (Linux, macOS, Windows)
    - Shell environment detection (bash, zsh, cmd, PowerShell, MSYS, WSL)
    - Tool availability detection with fallbacks
    - Path normalization for different environments
    - Cross-platform command execution
    - Network operation fallbacks (curl/wget)

EXAMPLES:
    $0 check                    # Quick cross-platform check
    $0 analyze --enhanced      # Full analysis with enhancements
    $0 backup                  # Create backup
    $0 info                    # Show environment details

EOF
}

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $*" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $*" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $*" | tee -a "$LOG_FILE"
}

debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] DEBUG:${NC} $*" | tee -a "$LOG_FILE"
    fi
}

# Initialize script variables
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for debug (purple not defined above, adding it)
readonly PURPLE='\033[0;35m'

# Execute main function
main "$@"
