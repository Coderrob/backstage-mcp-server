/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SOURCE_ROOT = 'src';
const SCRIPT_ROOT = 'scripts';
const PACKAGE_MANIFEST = 'package.json';
const KERNEL_PACKAGE_NAME = '@coderrob/mcp-kernel';
const KERNEL_VERSION_PATTERN = /^\^\d+\.\d+\.\d+$/;
const LOCAL_KERNEL_IMPORT_PATTERN =
  /(?:from\s+|import\s*(?:\(\s*)?)['"](?:\.\.?\/)+(?:mcp(?:\/[^'"]*|\.js)?|shared\/(?:constants\/mcp-protocol|logging\/logger)(?:\.js)?|types\/(?:logging|mcp|mcp-testing)(?:\.js)?)['"]/;
const ALLOWED_ROOT_TYPESCRIPT = new Set(['cli.ts', 'generate-manifest.ts', 'index.ts', 'server.ts']);
const SOURCE_FILE_PATTERN = /\.(?:cjs|js|mjs|ts)$/;
const TEST_FILE_PATTERN = /\.(?:spec|test)\.(cjs|js|mjs|ts)$/;
const SHELL_SCRIPT_PATTERN = /\.sh$/;
const TYPES_DIRECTORY_NAME = 'types';

/**
 * Requires one colocated unit-test module for every behavioral TypeScript module.
 * Declaration-only files under `types` are verified by both TypeScript builds.
 */
async function checkBehavioralTestCoverage() {
  const files = await listSourceFiles(SOURCE_ROOT);
  const fileSet = new Set(files);
  const productionFiles = files.filter(isBehavioralTypescript);
  const missingTests = productionFiles
    .filter(
      /** Selects production modules without a colocated test. */ (file) =>
        !fileSet.has(file.replace(/\.ts$/, '.test.ts'))
    )
    .map(/** Converts one uncovered module to a source-relative path. */ (file) => relative(SOURCE_ROOT, file));
  assert.deepEqual(missingTests.toSorted(), [], `Add a colocated test for each behavioral module: ${missingTests}`);
}

/**
 * Requires the published MCP kernel and rejects imports from its removed local implementation.
 */
async function checkPublishedKernelBoundary() {
  const packageMetadata = JSON.parse(await readFile(PACKAGE_MANIFEST, 'utf8'));
  const dependency = packageMetadata.dependencies?.[KERNEL_PACKAGE_NAME];
  assert.equal(typeof dependency, 'string', `${KERNEL_PACKAGE_NAME} must be a runtime dependency`);
  assert.match(
    dependency,
    KERNEL_VERSION_PATTERN,
    `${KERNEL_PACKAGE_NAME} must resolve from npm with a caret version, not a local protocol`
  );
  const inspectedFiles = await Promise.all((await listSourceFiles(SOURCE_ROOT)).map(inspectKernelImport));
  const violations = inspectedFiles.filter(
    /** Retains files that import a removed local kernel module. */ (file) => file !== undefined
  );
  assert.deepEqual(violations.sort(), [], `Use ${KERNEL_PACKAGE_NAME} instead of local kernel imports: ${violations}`);
}

/**
 * Reports a source file when it imports a removed local kernel module.
 * @param file - Source file to inspect.
 * @returns The source-relative violation or no value.
 */
async function inspectKernelImport(file) {
  const source = await readFile(file, 'utf8');
  return LOCAL_KERNEL_IMPORT_PATTERN.test(source) ? relative(SOURCE_ROOT, file) : undefined;
}

/**
 * Prevents feature implementations from accumulating beside package entrypoints.
 */
async function checkRootFiles() {
  const entries = await readdir(SOURCE_ROOT, { withFileTypes: true });
  const unexpected = entries
    .filter(isUnexpectedRootFile)
    .map(/** Selects the unexpected root entry name. */ (entry) => entry.name);
  assert.deepEqual(
    unexpected.toSorted(),
    [],
    `Move root TypeScript files into a cohesive source folder: ${unexpected}`
  );
}

/**
 * Requires a side-by-side BATS suite for every repository shell script.
 */
async function checkShellTestCoverage() {
  const entries = await readdir(SCRIPT_ROOT, { withFileTypes: true });
  const files = new Set(
    entries
      .filter(/** Selects files in the scripts directory. */ (entry) => entry.isFile())
      .map(/** Selects one script filename. */ (entry) => entry.name)
  );
  const missingTests = Array.from(files)
    .filter(
      /** Selects shell scripts without a same-name BATS suite. */ (file) =>
        SHELL_SCRIPT_PATTERN.test(file) && !files.has(file.replace(SHELL_SCRIPT_PATTERN, '.bats'))
    )
    .toSorted();
  assert.deepEqual(missingTests, [], `Add a colocated BATS test for each shell script: ${missingTests}`);
}

/**
 * Ensures every unit test is colocated with the module named by its file stem.
 */
async function checkTestColocation() {
  const files = await listSourceFiles(SOURCE_ROOT);
  const fileSet = new Set(files);
  const violations = files.filter(
    /** Selects test files whose corresponding source module is absent. */ (file) =>
      TEST_FILE_PATTERN.test(file) && !fileSet.has(file.replace(TEST_FILE_PATTERN, '.$1'))
  );
  const relativeViolations = violations.map(
    /** Converts one violation to a source-relative path. */ (file) => relative(SOURCE_ROOT, file)
  );
  assert.deepEqual(
    relativeViolations.toSorted(),
    [],
    `Colocate each test with its matching source module: ${violations}`
  );
}

/**
 * Reports whether a source path represents behavioral TypeScript.
 * @param file - Source path to classify.
 * @returns Whether the file requires a colocated test.
 */
function isBehavioralTypescript(file) {
  if (!file.endsWith('.ts') || TEST_FILE_PATTERN.test(file)) return false;
  return relative(SOURCE_ROOT, file).split(/[\\/]/)[0] !== TYPES_DIRECTORY_NAME;
}

/**
 * Reports whether an entry is a supported source file.
 * @param entry - Directory entry to classify.
 * @returns Whether the entry has a supported source extension.
 */
function isSupportedSourceEntry(entry) {
  return entry.isFile() && SOURCE_FILE_PATTERN.test(entry.name);
}

/**
 * Reports whether an entry is a TypeScript file.
 * @param entry - Directory entry to classify.
 * @returns Whether the entry is a TypeScript file.
 */
function isTypescriptFileEntry(entry) {
  return entry.isFile() && entry.name.endsWith('.ts');
}

/**
 * Reports whether a directory entry violates the source-root policy.
 * @param entry - Source-root directory entry.
 * @returns Whether the entry is an unexpected implementation module.
 */
function isUnexpectedRootFile(entry) {
  if (!isTypescriptFileEntry(entry)) return false;
  return !TEST_FILE_PATTERN.test(entry.name) && !ALLOWED_ROOT_TYPESCRIPT.has(entry.name);
}

/**
 * Resolves supported files represented by one directory entry.
 * @param directory - Parent directory containing the entry.
 * @param entry - Directory entry to inspect.
 * @returns Supported files represented by the entry.
 */
async function listEntryFiles(directory, entry) {
  const path = join(directory, entry.name);
  if (entry.isDirectory()) return listSourceFiles(path);
  return isSupportedSourceEntry(entry) ? [path] : [];
}

/**
 * Recursively lists source files below a directory.
 * @param directory - Directory to inspect.
 * @returns Absolute or workspace-relative source paths below the directory.
 */
async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(
      /** Resolves all supported files represented by one directory entry. */ (entry) =>
        listEntryFiles(directory, entry)
    )
  );
  return nestedFiles.flat();
}

await checkRootFiles();
await checkPublishedKernelBoundary();
await checkTestColocation();
await checkBehavioralTestCoverage();
await checkShellTestCoverage();
process.stdout.write('Source layout boundaries are valid\n');
