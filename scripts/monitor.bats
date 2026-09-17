#!/usr/bin/env bats

load './test-helper'

setup() {
    setup_script_fixture 'monitor.sh'
}

@test "monitor.sh can be sourced without running a monitor command" {
    run bash -c 'source "$1"; type main >/dev/null; printf sourced' _ "$TEST_SCRIPT"

    [ "$status" -eq 0 ]
    [ "$output" = 'sourced' ]
    [ ! -e "$TEST_PROJECT/monitoring.log" ]
}

@test "monitor.sh prints its command reference" {
    run bash "$TEST_SCRIPT" help

    [ "$status" -eq 0 ]
    [[ "$output" == *'Operational Monitoring & Alerting System v1.0.0'* ]]
    [[ "$output" == *'COMMANDS:'* ]]
}

@test "monitor.sh records a started operation" {
    run bash "$TEST_SCRIPT" start operation-1 build

    [ "$status" -eq 0 ]
    [ "$output" = 'operation-1' ]
    [ -f "$TEST_PROJECT/monitoring.log" ]
    grep -q '"operation_id": "operation-1"' "$TEST_PROJECT/monitoring.log"
    grep -q '"status": "running"' "$TEST_PROJECT/monitoring.log"
}

@test "monitor.sh treats an unsupported command as help" {
    run bash "$TEST_SCRIPT" unsupported

    [ "$status" -eq 0 ]
    [[ "$output" == *'USAGE:'* ]]
}
