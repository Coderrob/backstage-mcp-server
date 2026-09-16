#!/usr/bin/env bats

load './test-helper'

setup() {
    setup_script_fixture 'validate-build.sh'
}

@test "validate-build.sh can be sourced without starting a build" {
    run bash -c 'source "$1"; type main_enhanced >/dev/null; printf sourced' _ "$TEST_SCRIPT"

    [ "$status" -eq 0 ]
    [ "$output" = 'sourced' ]
    [ ! -e "$TEST_PROJECT/build-audit.jsonl" ]
}

@test "validate-build.sh prints enhanced help" {
    run bash "$TEST_SCRIPT" --help

    [ "$status" -eq 0 ]
    [[ "$output" == *'Enhanced Build Validation with Operational Transparency v2.0.0'* ]]
    [[ "$output" == *'--no-backup'* ]]
}

@test "validate-build.sh rejects an unknown option" {
    run bash "$TEST_SCRIPT" --unsupported

    [ "$status" -eq 1 ]
    [[ "$output" == *'Unknown option: --unsupported'* ]]
}

@test "validate-build.sh reports missing build artifacts" {
    run bash -c '
      source "$1"
      PROJECT_ROOT="$2"
      AUDIT_LOG="$2/audit.jsonl"
      BUILD_LOG="$2/build.log"
      PLATFORM=test
      SHELL_ENV=test
      COMMAND=test
      SCRIPT_ARGS=""
      validate_build_artifacts
    ' _ "$TEST_SCRIPT" "$TEST_PROJECT"

    [ "$status" -eq 1 ]
    grep -q 'Required build artifact missing' "$TEST_PROJECT/audit.jsonl"
}

@test "validate-build.sh accepts the required build artifacts" {
    mkdir -p "$TEST_PROJECT/dist"
    printf 'module.exports = {};\n' > "$TEST_PROJECT/dist/index.cjs"
    printf 'export {};\n' > "$TEST_PROJECT/dist/index.mjs"
    printf 'export {};\n' > "$TEST_PROJECT/dist/index.d.ts"
    printf '#!/usr/bin/env node\nmodule.exports = {};\n' > "$TEST_PROJECT/dist/cli.cjs"
    printf '#!/usr/bin/env node\nexport {};\n' > "$TEST_PROJECT/dist/cli.mjs"

    run bash -c '
      source "$1"
      PROJECT_ROOT="$2"
      AUDIT_LOG="$2/audit.jsonl"
      BUILD_LOG="$2/build.log"
      PLATFORM=test
      SHELL_ENV=test
      COMMAND=test
      SCRIPT_ARGS=""
      validate_build_artifacts
    ' _ "$TEST_SCRIPT" "$TEST_PROJECT"

    [ "$status" -eq 0 ]
    grep -q 'All build artifacts validated successfully' "$TEST_PROJECT/audit.jsonl"
}

@test "validate-build.sh rejects a CLI artifact without a shebang" {
    mkdir -p "$TEST_PROJECT/dist"
    printf 'module.exports = {};\n' > "$TEST_PROJECT/dist/index.cjs"
    printf 'export {};\n' > "$TEST_PROJECT/dist/index.mjs"
    printf 'export {};\n' > "$TEST_PROJECT/dist/index.d.ts"
    printf 'module.exports = {};\n' > "$TEST_PROJECT/dist/cli.cjs"
    printf '#!/usr/bin/env node\nexport {};\n' > "$TEST_PROJECT/dist/cli.mjs"

    run bash -c '
      source "$1"
      PROJECT_ROOT="$2"
      AUDIT_LOG="$2/audit.jsonl"
      BUILD_LOG="$2/build.log"
      PLATFORM=test
      SHELL_ENV=test
      COMMAND=test
      SCRIPT_ARGS=""
      validate_build_artifacts
    ' _ "$TEST_SCRIPT" "$TEST_PROJECT"

    [ "$status" -eq 1 ]
    grep -q 'CLI build missing shebang' "$TEST_PROJECT/audit.jsonl"
}

@test "validate-build.sh generates a valid report without jq" {
    mkdir -p "$TEST_PROJECT/dist"
    printf 'module.exports = {};\n' > "$TEST_PROJECT/dist/index.cjs"
    printf 'export {};\n' > "$TEST_PROJECT/dist/index.mjs"
    printf 'export {};\n' > "$TEST_PROJECT/dist/index.d.ts"
    printf '#!/usr/bin/env node\nmodule.exports = {};\n' > "$TEST_PROJECT/dist/cli.cjs"
    printf '#!/usr/bin/env node\nexport {};\n' > "$TEST_PROJECT/dist/cli.mjs"

    run bash -c '
      source "$1"
      PROJECT_ROOT="$2"
      AUDIT_LOG="$2/audit.jsonl"
      BUILD_LOG="$2/build.log"
      PLATFORM=test
      SHELL_ENV=test
      COMMAND=test
      SCRIPT_ARGS=""
      generate_build_report
      node -e "JSON.parse(require(\"fs\").readFileSync(process.argv[1], \"utf8\"))" "$2/build-report.json"
    ' _ "$TEST_SCRIPT" "$TEST_PROJECT"

    [ "$status" -eq 0 ]
    [ -f "$TEST_PROJECT/build-report.json" ]
}
