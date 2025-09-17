import { jest } from '@jest/globals';

import { generateManifest } from './generate-manifest.js';
import { logger } from './utils/core/logger.js';

// Mock dependencies
jest.mock('./utils/core/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Spy on logger methods
jest.spyOn(logger, 'info');
jest.spyOn(logger, 'error');

const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock path and url modules with proper Jest mocking
const mockFileURLToPath = jest.fn();
const mockDirname = jest.fn();
const mockJoin = jest.fn();

jest.mock('path', () => ({
  dirname: mockDirname,
  join: mockJoin,
}));

jest.mock('url', () => ({
  fileURLToPath: mockFileURLToPath,
}));

describe('generateManifest', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fileURLToPath and dirname
    mockFileURLToPath.mockReturnValue('/d:/backstage-mcp-server/src/generate-manifest.ts');
    mockDirname.mockReturnValue('/d:/backstage-mcp-server/src');
    mockJoin.mockReturnValue('/d:/backstage-mcp-server/tools-manifest.json');
  });

  it('should generate manifest successfully', async () => {
    await generateManifest();

    expect(mockLogger.info).toHaveBeenCalledWith('Tools manifest generated successfully!');
  });

  it('should handle errors gracefully', async () => {
    // Mock join to return an invalid path to trigger an error
    mockJoin.mockReturnValueOnce('/invalid/path/tools-manifest.json');

    // The function should still complete without throwing
    await expect(generateManifest()).resolves.not.toThrow();
  });
});
