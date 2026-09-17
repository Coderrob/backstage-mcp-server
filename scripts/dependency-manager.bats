#!/usr/bin/env bats

load './test-helper'

setup() {
    setup_script_fixture 'dependency-manager.sh'
}

@test "dependency-manager.sh can be sourced without starting analysis" {
    run bash -c 'source "$1"; type main_enhanced >/dev/null; printf sourced' _ "$TEST_SCRIPT"

    [ "$status" -eq 0 ]
    [ "$output" = 'sourced' ]
    [ ! -e "$TEST_PROJECT/dependency-report.md" ]
}

@test "dependency-manager.sh prints enhanced help" {
    run bash "$TEST_SCRIPT" --help

    [ "$status" -eq 0 ]
    [[ "$output" == *'Enhanced Dependency Compatibility Manager v2.0.0'* ]]
    [[ "$output" == *'--dry-run'* ]]
}

@test "dependency-manager.sh rejects an unknown option" {
    run bash "$TEST_SCRIPT" --unsupported

    [ "$status" -eq 1 ]
    [[ "$output" == *'Unknown option: --unsupported'* ]]
}

@test "dependency-manager.sh parses analysis flags without executing analysis" {
    run bash -c 'source "$1"; parse_args_enhanced --dry-run --debug; printf "%s:%s" "$DRY_RUN" "$DEBUG"' _ "$TEST_SCRIPT"

    [ "$status" -eq 0 ]
    [ "$output" = 'true:true' ]
}
