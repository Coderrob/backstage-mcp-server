#!/usr/bin/env bats

load './test-helper'

setup() {
    setup_script_fixture 'deps-crossplatform.sh'
    mkdir -p "$TEST_PROJECT/node_modules"
}

@test "deps-crossplatform.sh can be sourced without dispatching a command" {
    run bash -c 'source "$1"; type main >/dev/null; printf sourced' _ "$TEST_SCRIPT"

    [ "$status" -eq 0 ]
    [ "$output" = 'sourced' ]
}

@test "deps-crossplatform.sh prints its command reference" {
    run bash "$TEST_SCRIPT" help

    [ "$status" -eq 0 ]
    [[ "$output" == *'Cross-Platform Dependency Manager v1.0.0'* ]]
    [[ "$output" == *'COMMANDS:'* ]]
    [ ! -e "$TEST_PROJECT/nul" ]
}

@test "deps-crossplatform.sh rejects an unknown command" {
    run bash "$TEST_SCRIPT" unsupported

    [ "$status" -eq 1 ]
    [[ "$output" == *'Unknown command: unsupported'* ]]
}

@test "deps-crossplatform.sh preserves Unix paths on Unix platforms" {
    run bash -c 'source "$1"; OS=linux; normalize_path "/tmp/catalog"' _ "$TEST_SCRIPT"

    [ "$status" -eq 0 ]
    [ "$output" = '/tmp/catalog' ]
}
