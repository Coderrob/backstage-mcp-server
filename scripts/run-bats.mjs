/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd, env, exit, platform, stderr } from 'node:process';

const WINDOWS_BASH_PATHS = ['C:/Program Files/Git/bin/bash.exe', 'C:/Program Files/Git/usr/bin/bash.exe'];
const BATS_ENTRY = resolve('node_modules', 'bats', 'bin', 'bats');
const WINDOWS_PLATFORM = 'win32';

/**
 * Runs every colocated BATS suite through a platform-appropriate Bash.
 * @returns The BATS process exit status.
 */
function main() {
  const result = spawnSync(resolveBash(), [BATS_ENTRY, 'scripts'], { cwd: cwd(), stdio: 'inherit' });
  if (!result.error) return result.status ?? 1;
  stderr.write(`Unable to launch BATS: ${result.error.message}\n`);
  return 1;
}

/**
 * Resolves the Bash executable used to run BATS.
 * @returns A configured, discovered, or PATH-resolved Bash executable.
 */
function resolveBash() {
  if (env.BASH_PATH) return env.BASH_PATH;
  return platform === WINDOWS_PLATFORM ? resolveWindowsBash() : 'bash';
}

/**
 * Finds a Git for Windows Bash installation or falls back to PATH lookup.
 * @returns A Windows Bash executable path or command name.
 */
function resolveWindowsBash() {
  return (
    WINDOWS_BASH_PATHS.find(
      /** Selects the first installed Windows Bash executable. */ (candidate) => existsSync(candidate)
    ) ?? 'bash'
  );
}

exit(main());
