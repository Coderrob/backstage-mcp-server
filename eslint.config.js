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
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', '.yarn/**', 'node_modules/**', 'coverage/**', '__mocks__/**'],
  },
  {
    files: ['./src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        NodeJS: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleImportSort,
      'zero-tolerance': zeroTolerance,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...zeroTolerance.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/no-unused-modules': ['off', { unusedExports: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // zero-tolerance rule customizations
      'zero-tolerance/sort-imports': 'off',
      'zero-tolerance/max-function-lines': ['warn', { max: 50 }],
      'zero-tolerance/max-params': ['warn', { max: 5 }],
      'zero-tolerance/no-magic-numbers': 'off',
      'zero-tolerance/no-magic-strings': 'off',
      'zero-tolerance/require-jsdoc-functions': 'off',
      'zero-tolerance/no-re-export': 'off',
      'zero-tolerance/no-jest-have-been-called': 'off',
      'zero-tolerance/no-mock-implementation': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
  {
    files: ['./src/**/*.test.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        NodeJS: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleImportSort,
      'zero-tolerance': zeroTolerance,
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...zeroTolerance.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/no-unused-modules': ['off', { unusedExports: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'import/no-extraneous-dependencies': ['error', { devDependencies: ['./src/**/*.test.ts'] }],
      // zero-tolerance rule customizations for test files
      'zero-tolerance/sort-imports': 'off',
      'zero-tolerance/max-function-lines': ['warn', { max: 50 }],
      'zero-tolerance/max-params': ['warn', { max: 5 }],
      'zero-tolerance/no-magic-numbers': 'off',
      'zero-tolerance/no-magic-strings': 'off',
      'zero-tolerance/require-jsdoc-functions': 'off',
      'zero-tolerance/no-re-export': 'off',
      'zero-tolerance/no-mock-implementation': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
];
