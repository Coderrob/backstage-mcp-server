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
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import { readFileSync } from 'fs';
import process from 'process';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import preserveShebang from 'rollup-plugin-preserve-shebang';
import dts from 'rollup-plugin-dts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));

// External dependencies (should not be bundled)
const externalDeps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'node:fs',
  'node:path',
  'node:url',
  'node:process',
  'node:util',
  'fs',
  'path',
  'url',
  'process',
  'util',
  'stream',
  'events',
  'crypto',
  'os',
  'child_process',
  // tslib is shipped as ES and can confuse the commonjs plugin during parsing;
  // exclude it from bundling to allow the runtime to resolve it.
  'tslib',
  'tslib/*',
];

// Treat any import that resolves into node_modules as external as well. This
// keeps Rollup from trying to statically analyze and bundle third-party
// packages which can cause CJS/ESM interop issues during build.
const external = (id) => {
  if (!id) return false;
  if (id.includes('node_modules')) return true;
  return externalDeps.some((ext) => id === ext || id.startsWith(ext + '/'));
};

// Warning filter to suppress external dependency warnings
const onwarn = (warning, warn) => {
  // Suppress circular dependency warnings for external dependencies (node_modules)
  if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('node_modules')) {
    return;
  }

  // Suppress unresolved dependency warnings for external modules
  if (warning.code === 'UNRESOLVED_IMPORT' && external(String(warning.source))) {
    return;
  }

  // Show all other warnings
  warn(warning);
};

// Common plugins for both builds
const commonPlugins = [
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
  }),
  json(),
  nodeResolve({
    preferBuiltins: true,
    exportConditions: ['node'],
  }),
  commonjs({
    exclude: /node_modules/,
  }),
  // Avoid running the CommonJS plugin over node_modules which can cause it to
  // attempt to parse ESM files shipped by dependencies and surface internal
  // rollup/runtime errors. We only need CommonJS transformation for our own
  // generated artifacts if any.
  // Note: keep this conservative; if you rely on CJS-only deps, adjust as needed.
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false, // We'll generate declarations separately
    declarationMap: false,
    rootDir: './src',
    exclude: ['**/*.test.ts', '**/*.spec.ts'],
    sourceMap: true,
  }),
];

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true,
      exports: 'auto',
    },
    external,
    onwarn,
    plugins: [
      ...commonPlugins,
      terser({
        format: {
          comments: false,
        },
      }),
    ],
  },
  // CommonJS build with shebang for CLI usage
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto',
      banner: '#!/usr/bin/env node',
    },
    external,
    onwarn,
    plugins: [
      preserveShebang(),
      ...commonPlugins,
      terser({
        format: {
          comments: false,
        },
      }),
    ],
  },
  // TypeScript declarations bundled into a single file
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
    onwarn,
    external: (id) => {
      // External dependencies should not be included in declaration files
      // Use the same external resolution function so behavior is consistent.
      return external(String(id)) || String(id).includes('node_modules');
    },
  },
];
