#!/usr/bin/env bats

load './test-helper'

setup() {
    setup_script_fixture 'deps.sh'
}

@test "deps.sh can be sourced without executing its entrypoint" {
    run bash -c 'source "$1"; type main >/dev/null; printf sourced' _ "$TEST_SCRIPT"

    [ "$status" -eq 0 ]
    [ "$output" = 'sourced' ]
}

@test "deps.sh prints its command reference" {
    run bash "$TEST_SCRIPT" help

    [ "$status" -eq 0 ]
    [[ "$output" == *'Dependency Helper v1.0.0'* ]]
    [[ "$output" == *'COMMANDS:'* ]]
}

@test "deps.sh rejects an unknown command" {
    run bash "$TEST_SCRIPT" unsupported

    [ "$status" -eq 1 ]
    [[ "$output" == *'Unknown command: unsupported'* ]]
}

@test "deps.sh delegates deduplication to Yarn" {
    create_command_stub 'yarn' 'printf "yarn:%s\\n" "$*"'

    run bash "$TEST_SCRIPT" dedupe

    [ "$status" -eq 0 ]
    [[ "$output" == *'yarn:dedupe'* ]]
}
