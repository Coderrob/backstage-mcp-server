import { jest } from '@jest/globals';

// Make jest available globally for ESM tests
(globalThis as unknown as { jest: typeof jest }).jest = jest;
