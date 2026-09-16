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
import zeroTolerance from '@coderrob/eslint-plugin-zero-tolerance';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';

const nodeGlobals = {
  Buffer: 'readonly',
  NodeJS: 'readonly',
  URL: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  process: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
};

const zeroToleranceRules = {
  ...zeroTolerance.configs.recommended.rules,
  'zero-tolerance/no-mock-implementation': 'off',
  'zero-tolerance/no-set-interval-in-tests': 'off',
  'zero-tolerance/no-set-timeout-in-tests': 'off',
  'zero-tolerance/no-test-interface-declaration': 'off',
  'zero-tolerance/prefer-result-return': 'warn',
  'zero-tolerance/require-jsdoc-anonymous-functions': 'error',
  'zero-tolerance/require-jsdoc-functions': 'error',
  'zero-tolerance/require-test-description-style': 'off',
};

const jsdocDocumentationRules = {
  ...jsdoc.configs['flat/recommended-typescript-error'].rules,
  'jsdoc/check-param-names': 'off',
  'jsdoc/require-param': 'off',
  'jsdoc/require-param-description': 'off',
  'jsdoc/require-returns': 'off',
  'jsdoc/require-returns-description': 'off',
};

const MAX_MJS_COMPLEXITY = 3;
const MAX_MJS_FILE_LINES = 350;
const MAX_MJS_FUNCTION_LINES = 30;
const MAX_TYPESCRIPT_FUNCTION_LINES = 30;
const TYPESCRIPT_FILES = ['./src/**/*.ts'];
const TYPESCRIPT_TEST_FILES = ['./src/**/*.{test,spec}.ts'];
const TEST_FILES = ['**/*.{test,spec}.{js,mjs,cjs,ts}'];

const commonModulePlugins = {
  jsdoc,
  'simple-import-sort': simpleImportSort,
  'zero-tolerance': zeroTolerance,
  sonarjs,
};

const commonModuleRules = {
  'no-console': ['error', { allow: ['warn', 'error'] }],
  'simple-import-sort/exports': 'error',
  'simple-import-sort/imports': 'error',
  'sonarjs/cognitive-complexity': ['error', 10],
  'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
  'sonarjs/no-identical-functions': 'error',
  complexity: ['error', 10],
};

const testRuleOverrides = {
  'jsdoc/require-jsdoc': 'off',
  'max-lines': 'off',
  'max-lines-per-function': 'off',
  'zero-tolerance/max-function-lines': 'off',
  'zero-tolerance/no-mock-implementation': 'warn',
  'zero-tolerance/no-set-interval-in-tests': 'warn',
  'zero-tolerance/no-set-timeout-in-tests': 'warn',
  'zero-tolerance/no-test-interface-declaration': 'warn',
  'zero-tolerance/prefer-result-return': 'off',
  'zero-tolerance/require-jsdoc-anonymous-functions': 'off',
  'zero-tolerance/require-test-description-style': 'warn',
};

const repositoryQualityPlugin = {
  rules: {
    'require-jsdoc-classes': {
      meta: {
        type: 'suggestion',
        docs: { description: 'Require JSDoc documentation for every class' },
        messages: { missing: 'Class "{{name}}" is missing a JSDoc comment.' },
        schema: [],
      },
      /**
       * Creates the class-documentation visitor.
       * @param context - Active ESLint rule context.
       * @returns Visitors that validate class declarations and expressions.
       */
      create(context) {
        /**
         * Reports a class without an immediately preceding JSDoc block.
         * @param node - Class declaration or expression being validated.
         */
        function checkClass(node) {
          const target = documentationTarget(node);
          const comments = context.sourceCode.getCommentsBefore(target);
          const comment = comments.at(-1);
          const hasJsdoc =
            comment?.type === 'Block' &&
            comment.value.startsWith('*') &&
            comment.loc.end.line === target.loc.start.line - 1;
          if (!hasJsdoc) context.report({ node, messageId: 'missing', data: { name: node.id?.name ?? '<anonymous>' } });
        }

        /**
         * Resolves the syntax node that owns a class's leading documentation.
         * @param node - Class declaration or expression being validated.
         * @returns Export or variable wrapper when it owns the leading comment.
         */
        function documentationTarget(node) {
          const declaration = node.parent?.type === 'VariableDeclarator' ? node.parent.parent : node;
          if (
            declaration.parent?.type === 'ExportNamedDeclaration' ||
            declaration.parent?.type === 'ExportDefaultDeclaration'
          ) {
            return declaration.parent;
          }
          return declaration;
        }

        return { ClassDeclaration: checkClass, ClassExpression: checkClass };
      },
    },
  },
};

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', '.yarn/**', 'node_modules/**', 'coverage/**'],
  },
  {
    name: 'repository/javascript',
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: nodeGlobals,
    },
    plugins: commonModulePlugins,
    rules: {
      ...jsdocDocumentationRules,
      ...zeroToleranceRules,
      ...commonModuleRules,
    },
  },
  {
    name: 'repository/typescript',
    files: TYPESCRIPT_FILES,
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: nodeGlobals,
    },
    plugins: {
      ...commonModulePlugins,
      '@typescript-eslint': tseslint,
      'import-x': importPlugin,
      'repository-quality': repositoryQualityPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['strict-type-checked'].rules,
      ...importPlugin.flatConfigs.recommended.rules,
      ...importPlugin.flatConfigs.typescript.rules,
      ...jsdocDocumentationRules,
      ...zeroToleranceRules,
      ...commonModuleRules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'import-x/no-unused-modules': ['off', { unusedExports: true }],
      'import-x/no-unresolved': 'off',
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
      'repository-quality/require-jsdoc-classes': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
  {
    name: 'repository/typescript-production-limits',
    files: TYPESCRIPT_FILES,
    ignores: TYPESCRIPT_TEST_FILES,
    rules: {
      'max-lines-per-function': ['error', { max: MAX_TYPESCRIPT_FUNCTION_LINES, IIFEs: true }],
      'zero-tolerance/max-function-lines': ['error', { max: MAX_TYPESCRIPT_FUNCTION_LINES }],
    },
  },
  {
    name: 'repository/mjs-production-limits',
    files: ['**/*.mjs'],
    plugins: {
      jsdoc,
      'repository-quality': repositoryQualityPlugin,
    },
    rules: {
      ...jsdocDocumentationRules,
      complexity: ['error', MAX_MJS_COMPLEXITY],
      'max-lines': ['error', { max: MAX_MJS_FILE_LINES }],
      'max-lines-per-function': ['error', { max: MAX_MJS_FUNCTION_LINES, IIFEs: true }],
      'repository-quality/require-jsdoc-classes': 'error',
      'zero-tolerance/max-function-lines': ['error', { max: MAX_MJS_FUNCTION_LINES }],
      'zero-tolerance/require-jsdoc-anonymous-functions': 'error',
      'zero-tolerance/require-jsdoc-functions': 'error',
    },
  },
  {
    name: 'repository/tests',
    files: TEST_FILES,
    rules: testRuleOverrides,
  },
  {
    name: 'repository/typescript-tests',
    files: TYPESCRIPT_TEST_FILES,
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: TYPESCRIPT_TEST_FILES }],
    },
  },
];
