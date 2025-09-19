#!/usr/bin/env bash

# =============================================================================
# Enhanced Build Validation with Operational Transparency
# =============================================================================
#
# Comprehensive build validation with cross-platform support, error recovery,
# performance monitoring, and detailed audit trails for operational transparency.
#
# Features:
# - Cross-platform compatibility (Linux, macOS, Windows)
# - Build performance monitoring and metrics
# - Error recovery and rollback capabilities
# - Structured logging with audit trails
# - Resource usage tracking
# - Build artifact validation
# - Network resilience for external dependencies
#
# Author: GitHub Copilot
# Version: 2.0.0
# =============================================================================

# Cross-platform environment detection
detect_platform() {
    case "$(uname -s)" in
        Linux*)     PLATFORM="linux";;
        Darwin*)    PLATFORM="macos";;
        CYGWIN*|MINGW*|MSYS*) PLATFORM="windows";;
        *)          PLATFORM="unknown";;
    esac

    # Detect shell environment
    if [[ -n "$MSYSTEM" ]]; then
        SHELL_ENV="msys"
    elif [[ -n "$WSL_DISTRO_NAME" ]]; then
        SHELL_ENV="wsl"
    elif command -v cygwin1.dll >/dev/null 2>&1; then
        SHELL_ENV="cygwin"
    else
        SHELL_ENV="native"
    fi
}

# Structured JSON logging for audit trails
log_audit() {
    local level="$1"
    local event="$2"
    local details="${3:-{}}"

    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

    local pid=$$
    local user="${USER:-${USERNAME:-unknown}}"
    local hostname
    hostname=$(hostname 2>/dev/null || echo "unknown")

    local audit_entry
    audit_entry=$(cat <<EOF
{
  "timestamp": "$timestamp",
  "level": "$level",
  "event": "$event",
  "details": $details,
  "process": {
    "pid": $pid,
    "user": "$user",
    "hostname": "$hostname",
    "platform": "$PLATFORM",
    "shell_env": "$SHELL_ENV"
  },
  "build": {
    "script_version": "2.0.0",
    "project_root": "$PROJECT_ROOT",
    "command": "$COMMAND",
    "args": "$SCRIPT_ARGS"
  }
}
EOF
)

    echo "$audit_entry" >> "$AUDIT_LOG"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $level: $event" >> "$BUILD_LOG"
}

# Performance monitoring
start_timer() {
    local operation="$1"
    eval "${operation}_start=\$(date +%s 2>/dev/null || echo '0')"
    eval "${operation}_memory_start=\$(ps -o rss= -p \$\$ 2>/dev/null | awk '{print \$1*1024}' || echo '0')"
}

end_timer() {
    local operation="$1"
    local start_time
    local end_time
    local duration
    local memory_start
    local memory_end
    local memory_delta

    eval "start_time=\${${operation}_start}"
    end_time=$(date +%s 2>/dev/null || echo '0')
    duration=$((end_time - start_time))

    eval "memory_start=\${${operation}_memory_start}"
    memory_end=$(ps -o rss= -p $$ 2>/dev/null | awk '{print $1*1024}' || echo '0')
    memory_delta=$((memory_end - memory_start))

    local metrics
    metrics=$(cat <<EOF
{
  "operation": "$operation",
  "duration_seconds": $duration,
  "memory_delta_bytes": $memory_delta,
  "memory_peak_bytes": $memory_end
}
EOF
)

    log_audit "METRICS" "Operation completed" "$metrics"
}

# Resource monitoring
check_build_resources() {
    local min_disk_mb="${1:-100}"
    local min_memory_mb="${2:-100}"

    # Check disk space
    local available_mb
    if [[ "$PLATFORM" == "windows" ]]; then
        available_mb=$(df -m "$PROJECT_ROOT" 2>/dev/null | tail -1 | awk '{print $4}' || echo "1000")
    else
        available_mb=$(df -m "$PROJECT_ROOT" 2>/dev/null | tail -1 | awk '{print $4}' || echo "1000")
    fi

    if [[ $available_mb -lt $min_disk_mb ]]; then
        log_audit "ERROR" "Insufficient disk space for build" "{\"available_mb\": $available_mb, \"required_mb\": $min_disk_mb}"
        return 1
    fi

    # Check memory
    local memory_kb
    memory_kb=$(grep "MemAvailable" /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "1048576")
    local memory_mb=$((memory_kb / 1024))

    if [[ $memory_mb -lt $min_memory_mb ]]; then
        log_audit "WARN" "Low memory condition detected" "{\"available_mb\": $memory_mb, \"required_mb\": $min_memory_mb}"
    fi

    return 0
}

# Error recovery and rollback
create_build_backup() {
    local backup_dir="$PROJECT_ROOT/build-backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir" || {
        log_audit "ERROR" "Failed to create build backup directory" "{\"backup_dir\": \"$backup_dir\"}"
        return 1
    }

    # Backup existing build artifacts
    if [[ -d "$PROJECT_ROOT/dist" ]]; then
        cp -r "$PROJECT_ROOT/dist" "$backup_dir/" 2>/dev/null || true
    fi

    # Backup package files
    for file in package.json yarn.lock package-lock.json; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            cp "$PROJECT_ROOT/$file" "$backup_dir/" 2>/dev/null || true
        fi
    done

    echo "$backup_dir" > "$PROJECT_ROOT/.build_backup_path"
    log_audit "INFO" "Build backup created" "{\"backup_dir\": \"$backup_dir\"}"
}

rollback_build() {
    local backup_path_file="$PROJECT_ROOT/.build_backup_path"

    if [[ ! -f "$backup_path_file" ]]; then
        log_audit "ERROR" "No build backup found for rollback"
        return 1
    fi

    local backup_dir
    backup_dir=$(cat "$backup_path_file")

    if [[ ! -d "$backup_dir" ]]; then
        log_audit "ERROR" "Build backup directory does not exist" "{\"backup_dir\": \"$backup_dir\"}"
        return 1
    fi

    log_audit "INFO" "Rolling back build from backup" "{\"backup_dir\": \"$backup_dir\"}"

    # Restore build artifacts
    if [[ -d "$backup_dir/dist" ]]; then
        rm -rf "$PROJECT_ROOT/dist" 2>/dev/null || true
        cp -r "$backup_dir/dist" "$PROJECT_ROOT/" 2>/dev/null || {
            log_audit "ERROR" "Failed to restore dist directory from backup"
            return 1
        }
    fi

    # Restore package files
    for file in package.json yarn.lock package-lock.json; do
        if [[ -f "$backup_dir/$file" ]]; then
            cp "$backup_dir/$file" "$PROJECT_ROOT/" 2>/dev/null || {
                log_audit "WARN" "Failed to restore $file from backup"
            }
        fi
    done

    log_audit "INFO" "Build rollback completed successfully"
    rm -f "$backup_path_file"
}

# Network resilience for external operations
network_operation() {
    local command="$1"
    local max_retries="${2:-3}"
    local retry_delay="${3:-2}"
    local attempt=1

    while [[ $attempt -le $max_retries ]]; do
        log_audit "INFO" "Network operation attempt $attempt/$max_retries" "{\"command\": \"$command\"}"

        if eval "$command"; then
            return 0
        fi

        if [[ $attempt -lt $max_retries ]]; then
            log_audit "WARN" "Network operation failed, retrying in ${retry_delay}s"
            sleep "$retry_delay" 2>/dev/null || true
            retry_delay=$((retry_delay * 2))  # Exponential backoff
        fi

        ((attempt++))
    done

    log_audit "ERROR" "Network operation failed after $max_retries attempts" "{\"command\": \"$command\"}"
    return 1
}

# Build artifact validation
validate_build_artifacts() {
    local build_success=true

    log_audit "INFO" "Validating build artifacts"

    # Check for required files
    local required_files=("dist/index.mjs" "dist/index.cjs" "dist/index.d.ts")

    for file in "${required_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            log_audit "ERROR" "Required build artifact missing" "{\"file\": \"$file\"}"
            build_success=false
        else
            local file_size
            file_size=$(stat -f%z "$PROJECT_ROOT/$file" 2>/dev/null || stat -c%s "$PROJECT_ROOT/$file" 2>/dev/null || echo "0")
            log_audit "INFO" "Build artifact validated" "{\"file\": \"$file\", \"size_bytes\": $file_size}"
        fi
    done

    # Validate file contents
    if [[ -f "$PROJECT_ROOT/dist/index.cjs" ]]; then
        if ! head -1 "$PROJECT_ROOT/dist/index.cjs" | grep -q "#!/usr/bin/env node"; then
            log_audit "ERROR" "CommonJS build missing shebang"
            build_success=false
        fi
    fi

    # Check file sizes are reasonable (not empty, not too large)
    for file in "${required_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            local size
            size=$(stat -f%z "$PROJECT_ROOT/$file" 2>/dev/null || stat -c%s "$PROJECT_ROOT/$file" 2>/dev/null || echo "0")

            if [[ $size -lt 1000 ]]; then
                log_audit "WARN" "Build artifact unusually small" "{\"file\": \"$file\", \"size_bytes\": $size}"
            elif [[ $size -gt 10000000 ]]; then
                log_audit "WARN" "Build artifact unusually large" "{\"file\": \"$file\", \"size_bytes\": $size}"
            fi
        fi
    done

    if [[ "$build_success" == true ]]; then
        log_audit "INFO" "All build artifacts validated successfully"
        return 0
    else
        log_audit "ERROR" "Build artifact validation failed"
        return 1
    fi
}

# Runtime testing of build artifacts
test_build_artifacts() {
    log_audit "INFO" "Testing build artifact execution"

    # Test CommonJS build
    if [[ -f "$PROJECT_ROOT/dist/index.cjs" ]]; then
        if timeout 10s node "$PROJECT_ROOT/dist/index.cjs" --help >/dev/null 2>&1; then
            log_audit "INFO" "CommonJS build execution test passed"
        else
            local exit_code=$?
            log_audit "WARN" "CommonJS build execution test failed" "{\"exit_code\": $exit_code}"
        fi
    fi

    # Test ESM build
    if [[ -f "$PROJECT_ROOT/dist/index.mjs" ]]; then
        if timeout 10s node "$PROJECT_ROOT/dist/index.mjs" --help >/dev/null 2>&1; then
            log_audit "INFO" "ESM build execution test passed"
        else
            local exit_code=$?
            log_audit "WARN" "ESM build execution test failed" "{\"exit_code\": $exit_code}"
        fi
    fi
}

# Comprehensive build validation
validate_build_comprehensive() {
    local build_type="${1:-full}"
    local create_backup="${2:-true}"

    log_audit "INFO" "Starting comprehensive build validation" "{\"build_type\": \"$build_type\", \"create_backup\": \"$create_backup\"}"

    # Pre-build checks
    check_build_resources || return 1

    if [[ "$create_backup" == "true" ]]; then
        create_build_backup
    fi

    # Execute build with monitoring
    start_timer "build"

    case "$build_type" in
        "full")
            network_operation "yarn build" || {
                log_audit "ERROR" "Build failed"
                rollback_build
                return 1
            }
            ;;
        "dev")
            network_operation "yarn build:dev" || {
                log_audit "ERROR" "Development build failed"
                return 1
            }
            ;;
        "watch")
            log_audit "INFO" "Starting watch mode build"
            yarn build:watch &
            local watch_pid=$!
            log_audit "INFO" "Watch mode started" "{\"pid\": $watch_pid}"
            return 0
            ;;
    esac

    end_timer "build"

    # Post-build validation
    validate_build_artifacts || return 1
    test_build_artifacts

    # Generate build report
    generate_build_report

    log_audit "INFO" "Build validation completed successfully"
    return 0
}

# Build report generation
generate_build_report() {
    local report_file="$PROJECT_ROOT/build-report.json"
    local build_time
    build_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

    local file_sizes="{}"
    if [[ -f "$PROJECT_ROOT/dist/index.mjs" ]]; then
        local esm_size
        esm_size=$(stat -f%z "$PROJECT_ROOT/dist/index.mjs" 2>/dev/null || stat -c%s "$PROJECT_ROOT/dist/index.mjs" 2>/dev/null || echo "0")
        file_sizes=$(echo "$file_sizes" | jq ".esm = $esm_size")
    fi

    if [[ -f "$PROJECT_ROOT/dist/index.cjs" ]]; then
        local cjs_size
        cjs_size=$(stat -f%z "$PROJECT_ROOT/dist/index.cjs" 2>/dev/null || stat -c%s "$PROJECT_ROOT/dist/index.cjs" 2>/dev/null || echo "0")
        file_sizes=$(echo "$file_sizes" | jq ".cjs = $cjs_size")
    fi

    if [[ -f "$PROJECT_ROOT/dist/index.d.ts" ]]; then
        local dts_size
        dts_size=$(stat -f%z "$PROJECT_ROOT/dist/index.d.ts" 2>/dev/null || stat -c%s "$PROJECT_ROOT/dist/index.d.ts" 2>/dev/null || echo "0")
        file_sizes=$(echo "$file_sizes" | jq ".dts = $dts_size")
    fi

    local build_report
    build_report=$(cat <<EOF
{
  "build_report": {
    "timestamp": "$build_time",
    "platform": "$PLATFORM",
    "shell_env": "$SHELL_ENV",
    "success": true,
    "file_sizes_bytes": $file_sizes,
    "artifacts": {
      "esm": $([[ -f "$PROJECT_ROOT/dist/index.mjs" ]] && echo "true" || echo "false"),
      "cjs": $([[ -f "$PROJECT_ROOT/dist/index.cjs" ]] && echo "true" || echo "false"),
      "dts": $([[ -f "$PROJECT_ROOT/dist/index.d.ts" ]] && echo "true" || echo "false")
    },
    "logs": {
      "audit_log": "$AUDIT_LOG",
      "build_log": "$BUILD_LOG"
    }
  }
}
EOF
)

    echo "$build_report" > "$report_file"
    log_audit "INFO" "Build report generated" "{\"report_file\": \"$report_file\"}"
}

# Enhanced cleanup with audit
cleanup_enhanced() {
    local exit_code=$?

    log_audit "INFO" "Starting enhanced cleanup" "{\"exit_code\": $exit_code}"

    # Cleanup temporary files
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR" 2>/dev/null || log_audit "WARN" "Failed to cleanup temp directory"
    fi

    # Final audit entry
    log_audit "INFO" "Build validation script completed" "{\"exit_code\": $exit_code}"

    exit $exit_code
}

# Main enhanced validation function
main_enhanced() {
    # Initialize environment
    detect_platform

    readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    readonly AUDIT_LOG="$PROJECT_ROOT/build-audit.jsonl"
    readonly BUILD_LOG="$PROJECT_ROOT/build-validation.log"
    readonly TEMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t build-validation-XXXXXX 2>/dev/null || echo "/tmp/build-validation-$$")"

    readonly COMMAND="$0"
    readonly SCRIPT_ARGS="$*"

    # Set up cleanup trap
    trap cleanup_enhanced EXIT

    # Colors
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[1;33m'
    readonly RED='\033[0;31m'
    readonly BLUE='\033[0;34m'
    readonly NC='\033[0m'

    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}         Enhanced Build Validation with Operational Transparency${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    echo ""

    log_audit "INFO" "Enhanced build validation started" "{\"platform\": \"$PLATFORM\", \"shell_env\": \"$SHELL_ENV\"}"

    # Parse arguments
    local build_type="full"
    local create_backup="true"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev)
                build_type="dev"
                shift
                ;;
            --watch)
                build_type="watch"
                shift
                ;;
            --no-backup)
                create_backup="false"
                shift
                ;;
            --help)
                show_help_enhanced
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help_enhanced
                exit 1
                ;;
        esac
    done

    # Execute validation
    if validate_build_comprehensive "$build_type" "$create_backup"; then
        echo -e "${GREEN}✅ Build validation completed successfully${NC}"
        log_audit "INFO" "Build validation completed successfully"
        exit 0
    else
        echo -e "${RED}❌ Build validation failed${NC}"
        log_audit "ERROR" "Build validation failed"
        exit 1
    fi
}

# Enhanced help
show_help_enhanced() {
    cat << EOF
Enhanced Build Validation with Operational Transparency v2.0.0

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --dev          Validate development build instead of production
    --watch        Start watch mode (non-blocking validation)
    --no-backup    Skip backup creation before build
    --help         Show this help message

FEATURES:
    - Cross-platform compatibility (Linux, macOS, Windows)
    - Comprehensive build artifact validation
    - Performance monitoring and metrics collection
    - Error recovery with automatic rollback
    - Structured JSON audit logging
    - Network resilience for external operations
    - Resource usage tracking

AUDIT TRAILS:
    - build-audit.jsonl: Structured audit log
    - build-validation.log: Human-readable log
    - build-report.json: Final build report

EXAMPLES:
    $0                    # Full production build validation
    $0 --dev             # Development build validation
    $0 --no-backup       # Skip backup creation
    $0 --watch           # Start watch mode validation

EOF
}

# Execute enhanced validation
main_enhanced "$@"