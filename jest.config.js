/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.spec.json' }],
  },
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverageFrom: ['src/**/*.{ts,js}', '!src/**/*.spec.ts', '!src/**/*.test.ts', '!src/**/__fixtures__/**/*'],
};
