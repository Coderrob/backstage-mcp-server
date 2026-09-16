/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import * as mcp from './index.js';

describe('MCP public module', () => {
  it('should expose the supported harness factories', () => {
    expect(mcp).toMatchObject({
      createMcpServer: expect.any(Function),
      defineTool: expect.any(Function),
      defineResource: expect.any(Function),
      definePrompt: expect.any(Function),
      connectTestClient: expect.any(Function),
      stdioTransport: expect.any(Function),
    });
  });
});
