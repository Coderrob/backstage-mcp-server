#!/usr/bin/env bash

# Shared fixture helpers for colocated BATS shell-script tests.

setup_script_fixture() {
    local script_name="$1"
    TEST_PROJECT="$BATS_TEST_TMPDIR/project"
    TEST_SCRIPT_DIR="$TEST_PROJECT/scripts"
    TEST_SCRIPT="$TEST_SCRIPT_DIR/$script_name"
    mkdir -p "$TEST_SCRIPT_DIR"
    cp "$BATS_TEST_DIRNAME/$script_name" "$TEST_SCRIPT"
    chmod +x "$TEST_SCRIPT"
    cd "$TEST_PROJECT"
}

create_command_stub() {
    local command_name="$1"
    local command_body="$2"
    local stub_directory="$BATS_TEST_TMPDIR/bin"
    mkdir -p "$stub_directory"
    printf '#!/usr/bin/env bash\n%s\n' "$command_body" > "$stub_directory/$command_name"
    chmod +x "$stub_directory/$command_name"
    PATH="$stub_directory:$PATH"
    export PATH
}
