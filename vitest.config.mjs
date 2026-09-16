/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**',
        'src/testing/**',
        'src/**/__fixtures__/**',
        'src/**/*.example.ts',
      ],
      thresholds: {
        perFile: true,
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
});
