#!/usr/bin/env bash

# =============================================================================
# Operational Monitoring & Alerting System
# =============================================================================
#
# Comprehensive monitoring system for operational transparency, providing
# real-time tracking of build operations, dependency management, and system
# health with automated alerting for failures and error conditions.
#
# Features:
# - Real-time operation monitoring
# - Automated failure detection and alerting
# - Performance metrics collection
# - SLA tracking and reporting
# - Cross-platform notification systems
# - Audit trail aggregation
# - Health dashboard generation
#
# Author: GitHub Copilot
# Version: 1.0.0
# =============================================================================

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly MONITOR_LOG="$PROJECT_ROOT/monitoring.log"
readonly ALERTS_LOG="$PROJECT_ROOT/alerts.jsonl"
readonly METRICS_DB="$PROJECT_ROOT/metrics.db"
readonly HEALTH_DASHBOARD="$PROJECT_ROOT/health-dashboard.md"

# Monitoring configuration
readonly ALERT_THRESHOLDS_BUILD_TIME=300      # 5 minutes
readonly ALERT_THRESHOLDS_MEMORY_MB=500       # 500MB
readonly ALERT_THRESHOLDS_DISK_MB=100         # 100MB free
readonly SLA_TARGET_SUCCESS_RATE=95           # 95% success rate

# Cross-platform notification
send_notification() {
    local level="$1"
    local title="$2"
    local message="$3"
    local details="${4:-}"

    # Log the alert
    local alert_entry
    alert_entry=$(cat <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "level": "$level",
  "title": "$title",
  "message": "$message",
  "details": $details,
  "platform": "$PLATFORM",
  "hostname": "$(hostname)"
}
EOF
)
    echo "$alert_entry" >> "$ALERTS_LOG"

    # Platform-specific notifications
    case "$PLATFORM" in
        "linux")
            # Linux notifications (notify-send, wall, etc.)
            if command -v notify-send >/dev/null 2>&1; then
                notify-send "$title" "$message" 2>/dev/null || true
            fi
            ;;
        "macos")
            # macOS notifications
            if command -v osascript >/dev/null 2>&1; then
                osascript -e "display notification \"$message\" with title \"$title\"" 2>/dev/null || true
            fi
            ;;
        "windows")
            # Windows notifications (PowerShell if available)
            if command -v powershell.exe >/dev/null 2>&1; then
                powershell.exe -Command "New-BurntToastNotification -Text '$title', '$message'" 2>/dev/null || true
            fi
            ;;
    esac

    # Console output with color coding
    case "$level" in
        "CRITICAL")
            echo -e "\033[1;31m🚨 CRITICAL: $title - $message\033[0m"
            ;;
        "ERROR")
            echo -e "\033[0;31m❌ ERROR: $title - $message\033[0m"
            ;;
        "WARN")
            echo -e "\033[1;33m⚠️  WARN: $title - $message\033[0m"
            ;;
        "INFO")
            echo -e "\033[0;32mℹ️  INFO: $title - $message\033[0m"
            ;;
    esac
}

# Operation monitoring
start_operation_monitor() {
    local operation_id="$1"
    local operation_type="$2"

    # Create monitoring entry
    local monitor_entry
    monitor_entry=$(cat <<EOF
{
  "operation_id": "$operation_id",
  "operation_type": "$operation_type",
  "start_time": "$(date +%s)",
  "status": "running",
  "platform": "$PLATFORM",
  "user": "${USER:-${USERNAME:-unknown}}",
  "working_dir": "$PWD"
}
EOF
)

    echo "$monitor_entry" >> "$MONITOR_LOG"
    echo "$operation_id"  # Return operation ID for tracking
}

end_operation_monitor() {
    local operation_id="$1"
    local exit_code="$2"
    local duration="${3:-}"
    local metrics="${4:-{}}"

    # Calculate duration if not provided
    if [[ -z "$duration" ]]; then
        local start_time
        start_time=$(grep "\"operation_id\": \"$operation_id\"" "$MONITOR_LOG" | tail -1 | jq -r '.start_time // 0' 2>/dev/null || echo "0")
        local end_time
        end_time=$(date +%s)
        duration=$((end_time - start_time))
    fi

    # Update monitoring entry
    local status="completed"
    [[ $exit_code -ne 0 ]] && status="failed"

    local update_entry
    update_entry=$(cat <<EOF
{
  "operation_id": "$operation_id",
  "end_time": "$(date +%s)",
  "duration_seconds": $duration,
  "exit_code": $exit_code,
  "status": "$status",
  "metrics": $metrics
}
EOF
)

    echo "$update_entry" >> "$MONITOR_LOG"

    # Check for alerts
    check_operation_alerts "$operation_id" "$exit_code" "$duration"
}

# Alert checking
check_operation_alerts() {
    local operation_id="$1"
    local exit_code="$2"
    local duration="$3"

    # Failure alerts
    if [[ $exit_code -ne 0 ]]; then
        send_notification "ERROR" "Operation Failed" "Operation $operation_id failed with exit code $exit_code" \
            "{\"operation_id\": \"$operation_id\", \"exit_code\": $exit_code, \"duration\": $duration}"
    fi

    # Performance alerts
    if [[ $duration -gt $ALERT_THRESHOLDS_BUILD_TIME ]]; then
        send_notification "WARN" "Slow Operation" "Operation $operation_id took ${duration}s (threshold: ${ALERT_THRESHOLDS_BUILD_TIME}s)" \
            "{\"operation_id\": \"$operation_id\", \"duration\": $duration, \"threshold\": $ALERT_THRESHOLDS_BUILD_TIME}"
    fi
}

# Health monitoring
monitor_system_health() {
    local check_type="${1:-full}"

    case "$check_type" in
        "disk")
            check_disk_space
            ;;
        "memory")
            check_memory_usage
            ;;
        "network")
            check_network_connectivity
            ;;
        "full")
            check_disk_space
            check_memory_usage
            check_network_connectivity
            ;;
    esac
}

check_disk_space() {
    local available_mb
    available_mb=$(df -m "$PROJECT_ROOT" 2>/dev/null | tail -1 | awk '{print $4}' || echo "1000")

    if [[ $available_mb -lt $ALERT_THRESHOLDS_DISK_MB ]]; then
        send_notification "CRITICAL" "Low Disk Space" "Only ${available_mb}MB free space available" \
            "{\"available_mb\": $available_mb, \"threshold_mb\": $ALERT_THRESHOLDS_DISK_MB}"
    fi

    # Record metric
    record_metric "disk_space_mb" "$available_mb"
}

check_memory_usage() {
    local memory_kb
    memory_kb=$(grep "MemAvailable" /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "1048576")
    local memory_mb=$((memory_kb / 1024))

    if [[ $memory_mb -lt $ALERT_THRESHOLDS_MEMORY_MB ]]; then
        send_notification "WARN" "High Memory Usage" "Only ${memory_mb}MB memory available" \
            "{\"available_mb\": $memory_mb, \"threshold_mb\": $ALERT_THRESHOLDS_MEMORY_MB}"
    fi

    record_metric "memory_available_mb" "$memory_mb"
}

check_network_connectivity() {
    if ! curl -s --connect-timeout 5 https://registry.npmjs.org >/dev/null 2>&1; then
        send_notification "ERROR" "Network Connectivity" "Cannot reach npm registry" \
            "{\"registry\": \"https://registry.npmjs.org\"}"
    fi
}

# Metrics collection
record_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local timestamp
    timestamp=$(date +%s)

    # Simple metrics storage (could be enhanced with SQLite or other DB)
    local metric_entry="$timestamp|$metric_name|$metric_value"
    echo "$metric_entry" >> "$METRICS_DB"
}

# SLA tracking
calculate_sla_metrics() {
    local time_window="${1:-24h}"  # Default: last 24 hours

    # Calculate success rate
    local total_operations
    local successful_operations

    case "$time_window" in
        "24h")
            local cutoff_time=$(( $(date +%s) - 86400 ))
            total_operations=$(grep -c "start_time.*$cutoff_time" "$MONITOR_LOG" 2>/dev/null || echo "0")
            successful_operations=$(grep '"status": "completed"' "$MONITOR_LOG" | grep -c "end_time.*$cutoff_time" 2>/dev/null || echo "0")
            ;;
        "7d")
            local cutoff_time=$(( $(date +%s) - 604800 ))
            total_operations=$(grep -c "start_time.*$cutoff_time" "$MONITOR_LOG" 2>/dev/null || echo "0")
            successful_operations=$(grep '"status": "completed"' "$MONITOR_LOG" | grep -c "end_time.*$cutoff_time" 2>/dev/null || echo "0")
            ;;
    esac

    local success_rate=0
    if [[ $total_operations -gt 0 ]]; then
        success_rate=$(( (successful_operations * 100) / total_operations ))
    fi

    # Check SLA compliance
    if [[ $success_rate -lt $SLA_TARGET_SUCCESS_RATE ]]; then
        send_notification "CRITICAL" "SLA Violation" "Success rate ${success_rate}% below target ${SLA_TARGET_SUCCESS_RATE}%" \
            "{\"success_rate\": $success_rate, \"target\": $SLA_TARGET_SUCCESS_RATE, \"time_window\": \"$time_window\"}"
    fi

    echo "SLA Metrics ($time_window): ${success_rate}% success rate (${successful_operations}/${total_operations} operations)"
}

# Dashboard generation
generate_health_dashboard() {
    local dashboard_file="$HEALTH_DASHBOARD"

    cat > "$dashboard_file" << EOF
# Health Dashboard

Generated: $(date)
Platform: $PLATFORM
Hostname: $(hostname)

## System Health

### Disk Space
$(check_disk_space_status)

### Memory Usage
$(check_memory_status)

### Network Connectivity
$(check_network_status)

## Recent Operations

### Last 10 Operations
$(show_recent_operations 10)

### Success Rate (24h)
$(calculate_sla_metrics "24h")

### Success Rate (7d)
$(calculate_sla_metrics "7d")

## Active Alerts

$(show_recent_alerts 5)

## Performance Metrics

$(show_performance_metrics)

---

*Dashboard auto-generated by monitoring system*
EOF

    send_notification "INFO" "Health Dashboard Updated" "Health dashboard has been regenerated" "{\"dashboard_file\": \"$dashboard_file\"}"
}

# Helper functions for dashboard
check_disk_space_status() {
    local available_mb
    available_mb=$(df -m "$PROJECT_ROOT" 2>/dev/null | tail -1 | awk '{print $4}' || echo "1000")

    if [[ $available_mb -lt $ALERT_THRESHOLDS_DISK_MB ]]; then
        echo "❌ CRITICAL: ${available_mb}MB available (< ${ALERT_THRESHOLDS_DISK_MB}MB threshold)"
    elif [[ $available_mb -lt $((ALERT_THRESHOLDS_DISK_MB * 2)) ]]; then
        echo "⚠️  WARNING: ${available_mb}MB available"
    else
        echo "✅ OK: ${available_mb}MB available"
    fi
}

check_memory_status() {
    local memory_kb
    memory_kb=$(grep "MemAvailable" /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "1048576")
    local memory_mb=$((memory_kb / 1024))

    if [[ $memory_mb -lt $ALERT_THRESHOLDS_MEMORY_MB ]]; then
        echo "❌ CRITICAL: ${memory_mb}MB available (< ${ALERT_THRESHOLDS_MEMORY_MB}MB threshold)"
    elif [[ $memory_mb -lt $((ALERT_THRESHOLDS_MEMORY_MB * 2)) ]]; then
        echo "⚠️  WARNING: ${memory_mb}MB available"
    else
        echo "✅ OK: ${memory_mb}MB available"
    fi
}

check_network_status() {
    if curl -s --connect-timeout 5 https://registry.npmjs.org >/dev/null 2>&1; then
        echo "✅ OK: Network connectivity confirmed"
    else
        echo "❌ ERROR: Cannot reach npm registry"
    fi
}

show_recent_operations() {
    local count="${1:-5}"

    echo "| Operation | Status | Duration | Time |"
    echo "|-----------|--------|----------|------|"

    tail -"$count" "$MONITOR_LOG" 2>/dev/null | while read -r line; do
        local operation_type status duration timestamp
        operation_type=$(echo "$line" | jq -r '.operation_type // "unknown"' 2>/dev/null || echo "unknown")
        status=$(echo "$line" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
        duration=$(echo "$line" | jq -r '.duration_seconds // 0' 2>/dev/null || echo "0")
        timestamp=$(echo "$line" | jq -r '.start_time // 0' 2>/dev/null | xargs -I {} date -d "@{}" +"%H:%M:%S" 2>/dev/null || echo "unknown")

        echo "| $operation_type | $status | ${duration}s | $timestamp |"
    done || echo "| No operations found | - | - | - |"
}

show_recent_alerts() {
    local count="${1:-5}"

    tail -"$count" "$ALERTS_LOG" 2>/dev/null | while read -r line; do
        local level title message timestamp
        level=$(echo "$line" | jq -r '.level // "unknown"' 2>/dev/null || echo "unknown")
        title=$(echo "$line" | jq -r '.title // "unknown"' 2>/dev/null || echo "unknown")
        message=$(echo "$line" | jq -r '.message // "unknown"' 2>/dev/null || echo "unknown")
        timestamp=$(echo "$line" | jq -r '.timestamp // "unknown"' 2>/dev/null || echo "unknown")

        echo "- **$level**: $title - $message ($timestamp)"
    done || echo "- No recent alerts"
}

show_performance_metrics() {
    echo "### Recent Metrics"
    echo "| Metric | Value | Timestamp |"
    echo "|--------|-------|-----------|"

    tail -10 "$METRICS_DB" 2>/dev/null | while read -r line; do
        local timestamp metric_name metric_value
        IFS='|' read -r timestamp metric_name metric_value <<< "$line"
        local time_str
        time_str=$(date -d "@$timestamp" +"%H:%M:%S" 2>/dev/null || echo "unknown")

        echo "| $metric_name | $metric_value | $time_str |"
    done || echo "| No metrics available | - | - |"
}

# Main monitoring function
main() {
    # Detect platform
    case "$(uname -s)" in
        Linux*) PLATFORM="linux";;
        Darwin*) PLATFORM="macos";;
        CYGWIN*|MINGW*|MSYS*) PLATFORM="windows";;
        *) PLATFORM="unknown";;
    esac

    case "${1:-help}" in
        "health")
            monitor_system_health "${2:-full}"
            ;;
        "alerts")
            show_recent_alerts "${2:-10}"
            ;;
        "sla")
            calculate_sla_metrics "${2:-24h}"
            ;;
        "dashboard")
            generate_health_dashboard
            ;;
        "start")
            # Start monitoring a specific operation
            shift
            start_operation_monitor "$@"
            ;;
        "end")
            # End monitoring with results
            shift
            end_operation_monitor "$@"
            ;;
        "help"|*)
            cat << EOF
Operational Monitoring & Alerting System v1.0.0

USAGE:
    $0 <command> [options]

COMMANDS:
    health [type]     Run health checks (disk|memory|network|full)
    alerts [count]    Show recent alerts
    sla [window]      Calculate SLA metrics (24h|7d)
    dashboard         Generate health dashboard
    start <id> <type> Start monitoring an operation
    end <id> <code>   End monitoring with exit code
    help              Show this help

EXAMPLES:
    $0 health full           # Full health check
    $0 alerts 5              # Show last 5 alerts
    $0 sla 7d                # 7-day SLA metrics
    $0 dashboard             # Generate dashboard

EOF
            ;;
    esac
}

# Execute main function
main "$@"
