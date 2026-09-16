/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SOURCE_ROOT = 'src';
const SCRIPT_ROOT = 'scripts';
const MCP_ROOT = join(SOURCE_ROOT, 'mcp');
const ALLOWED_MCP_PARENT_IMPORTS = new Set(['../shared/logging/logger.js']);
const ALLOWED_ROOT_TYPESCRIPT = new Set(['cli.ts', 'generate-manifest.ts', 'index.ts', 'server.ts']);
const SOURCE_FILE_PATTERN = /\.(?:cjs|js|mjs|ts)$/;
const TEST_FILE_PATTERN = /\.(?:spec|test)\.(cjs|js|mjs|ts)$/;
const SHELL_SCRIPT_PATTERN = /\.sh$/;

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
 * Reports whether a directory entry violates the source-root policy.
 * @param entry - Source-root directory entry.
 * @returns Whether the entry is an unexpected implementation module.
 */
function isUnexpectedRootFile(entry) {
  if (!isTypescriptFileEntry(entry)) return false;
  return !TEST_FILE_PATTERN.test(entry.name) && !ALLOWED_ROOT_TYPESCRIPT.has(entry.name);
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
 * Prevents the reusable MCP kernel from importing application-specific source areas.
 */
async function checkMcpBoundary() {
  const violations = [];
  for (const file of await listSourceFiles(MCP_ROOT)) {
    const source = await readFile(file, 'utf8');
    const forbiddenImports = findParentImports(source).filter(
      /** Rejects parent imports that are not explicitly generic shared infrastructure. */ (specifier) =>
        !ALLOWED_MCP_PARENT_IMPORTS.has(specifier)
    );
    if (forbiddenImports.length > 0) {
      violations.push(`${relative(SOURCE_ROOT, file)} -> ${forbiddenImports.join(', ')}`);
    }
  }
  assert.deepEqual(violations.sort(), [], `The generic MCP kernel imports application code: ${violations}`);
}

/**
 * Finds static and dynamic imports that escape the MCP source directory.
 * @param source - JavaScript or TypeScript module source.
 * @returns Parent-relative module specifiers found in the source.
 */
function findParentImports(source) {
  const imports = source.matchAll(/(?:from\s+|import\s*\(\s*)['"](\.\.\/[^'"]+)['"]/g);
  return Array.from(imports, /** Selects the captured module specifier. */ (match) => match[1]);
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
 * Reports whether a source path represents behavioral TypeScript.
 * @param file - Source path to classify.
 * @returns Whether the file requires a colocated test.
 */
function isBehavioralTypescript(file) {
  if (!file.endsWith('.ts') || TEST_FILE_PATTERN.test(file)) return false;
  return relative(SOURCE_ROOT, file).split(/[\\/]/)[0] !== 'types';
}

await checkRootFiles();
await checkMcpBoundary();
await checkTestColocation();
await checkBehavioralTestCoverage();
await checkShellTestCoverage();
process.stdout.write('Source layout boundaries are valid\n');
