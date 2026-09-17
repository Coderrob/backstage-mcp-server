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

const ESLINT_WARNING_SEVERITY = 'warn';
const AST_BLOCK_COMMENT = 'Block';
const AST_VARIABLE_DECLARATOR = 'VariableDeclarator';
const AST_NAMED_EXPORT = 'ExportNamedDeclaration';
const AST_DEFAULT_EXPORT = 'ExportDefaultDeclaration';

/**
 * Promotes plugin recommendations from advisory warnings to blocking errors.
 * @param rules - Recommended plugin rules.
 * @returns Repository-enforced rule severities.
 */
function enforceRecommendedRules(rules) {
  return Object.fromEntries(
    Object.entries(rules).map(
      /** Promotes advisory rules while retaining existing options. */ ([ruleName, setting]) => {
        if (setting === ESLINT_WARNING_SEVERITY) return [ruleName, 'error'];
        if (Array.isArray(setting) && setting[0] === ESLINT_WARNING_SEVERITY) {
          return [ruleName, ['error', ...setting.slice(1)]];
        }
        return [ruleName, setting];
      }
    )
  );
}

const zeroToleranceRules = {
  ...enforceRecommendedRules(zeroTolerance.configs.recommended.rules),
  // The MCP SDK and Backstage clients use exceptions as their typed failure boundary.
  'zero-tolerance/prefer-result-return': 'off',
  // Stateful lifecycle stores and test recorders require deliberate local mutation.
  'zero-tolerance/no-array-mutation': 'off',
  'zero-tolerance/no-map-set-mutation': 'off',
  'zero-tolerance/no-object-mutation': 'off',
  // Public names follow the upstream MCP and Backstage vocabulary rather than Hungarian notation.
  'zero-tolerance/require-interface-prefix': 'off',
  // Package facades intentionally re-export cohesive public contracts.
  'zero-tolerance/no-barrel-parent-imports': 'off',
  'zero-tolerance/no-re-export': 'off',
  'zero-tolerance/require-barrel-relative-exports': 'off',
  // Time, environment, and ordered lifecycle access occur at explicit application boundaries.
  'zero-tolerance/no-await-in-loop': 'off',
  'zero-tolerance/no-date-now': 'off',
  'zero-tolerance/no-process-env-outside-config': 'off',
  'zero-tolerance/prefer-readonly-parameters': 'off',
  // Function locality is preferred over alphabetical declaration ordering.
  'zero-tolerance/sort-functions': 'off',
  // Numeric protocol assertions are clearer next to their expected values.
  'zero-tolerance/no-magic-numbers': 'off',
  // ESLint's canonical import sorter is the single ordering authority.
  'zero-tolerance/sort-imports': 'off',
  // Typed error factories preserve domain codes before the error is thrown.
  'zero-tolerance/no-throw-literal': 'off',
  'zero-tolerance/no-hardcoded-secrets': [
    'error',
    {
      allowedPatterns: ['BACKSTAGE_TOKEN', '(?:test|smoke|static|process)-token', '/run/secrets/'],
      checkTests: true,
    },
  ],
  'zero-tolerance/require-timeout-for-io': ['error', { approvedWrapperNames: ['fetchImplementation'] }],
  'zero-tolerance/require-jsdoc-anonymous-functions': 'error',
  'zero-tolerance/require-jsdoc-functions': 'error',
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

const productionOnlyRules = {
  'zero-tolerance/no-jest-have-been-called': 'off',
  'zero-tolerance/no-mock-implementation': 'off',
};

const testRules = {
  'max-lines': 'off',
  'max-lines-per-function': 'off',
  'no-restricted-syntax': [
    'error',
    {
      selector: 'TSTypeAliasDeclaration',
      message: 'Declare reusable contracts in src/types and import them into tests.',
    },
    {
      selector: 'TSIndexedAccessType',
      message: 'Use a named exported contract instead of extracting a property type in a test.',
    },
  ],
  'zero-tolerance/max-function-lines': 'off',
  'zero-tolerance/no-mock-implementation': 'error',
  'zero-tolerance/no-set-interval-in-tests': 'error',
  'zero-tolerance/no-set-timeout-in-tests': 'error',
  'zero-tolerance/no-test-interface-declaration': 'error',
  'zero-tolerance/no-type-assertion': 'error',
  'zero-tolerance/prefer-result-return': 'off',
  'zero-tolerance/require-jsdoc-anonymous-functions': 'off',
  'zero-tolerance/require-test-description-style': 'error',
};

/**
 * Resolves the syntax node that owns a class's leading documentation.
 * @param node - Class declaration or expression being validated.
 * @returns Export or variable wrapper when it owns the leading comment.
 */
function documentationTarget(node) {
  const declaration = node.parent?.type === AST_VARIABLE_DECLARATOR ? node.parent.parent : node;
  if (declaration.parent?.type === AST_NAMED_EXPORT || declaration.parent?.type === AST_DEFAULT_EXPORT) {
    return declaration.parent;
  }
  return declaration;
}

/**
 * Creates the class-documentation visitor.
 * @param context - Active ESLint rule context.
 * @returns Visitors that validate class declarations and expressions.
 */
function createClassDocumentationVisitor(context) {
  /**
   * Reports a class without an immediately preceding JSDoc block.
   * @param node - Class declaration or expression being validated.
   */
  function checkClass(node) {
    const target = documentationTarget(node);
    const comment = context.sourceCode.getCommentsBefore(target).at(-1);
    const hasJsdoc =
      comment?.type === AST_BLOCK_COMMENT &&
      comment.value.startsWith('*') &&
      comment.loc.end.line === target.loc.start.line - 1;
    if (!hasJsdoc) context.report({ node, messageId: 'missing', data: { name: node.id?.name ?? '<anonymous>' } });
  }
  return { ClassDeclaration: checkClass, ClassExpression: checkClass };
}

const repositoryQualityPlugin = {
  rules: {
    'require-jsdoc-classes': {
      meta: {
        type: 'suggestion',
        docs: { description: 'Require JSDoc documentation for every class' },
        messages: { missing: 'Class "{{name}}" is missing a JSDoc comment.' },
        schema: [],
      },
      create: createClassDocumentationVisitor,
    },
  },
};

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'build-backups/**', '.yarn/**', 'node_modules/**', 'coverage/**'],
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
      ...productionOnlyRules,
      'zero-tolerance/require-exported-object-type': 'off',
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
      ...productionOnlyRules,
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
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: TYPESCRIPT_TEST_FILES }],
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
    rules: testRules,
  },
];
