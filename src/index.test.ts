/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import * as packageApi from './index.js';

describe('package API', () => {
  it('should expose server, harness, Backstage, and logging APIs without starting a process', () => {
    expect(packageApi).toMatchObject({
      createBackstageServer: expect.any(Function),
      createMcpServer: expect.any(Function),
      backstageCatalogPlugin: expect.any(Object),
      generateManifest: expect.any(Function),
      createStderrLogger: expect.any(Function),
      McpErrorCode: expect.any(Object),
      LogLevel: expect.any(Object),
    });
  });
});
