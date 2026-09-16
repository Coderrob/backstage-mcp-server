/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { McpApplicationState } from '../shared/constants/mcp-protocol.js';
import { createMcpServer } from './application.js';
import { definePlugin, defineTool } from './definitions.js';
import { jsonResult } from './results.js';
import { connectTestClient } from './testing.js';

describe('connectTestClient', () => {
  it('should connect an SDK client and close the complete application boundary', async () => {
    const tool = defineTool<object>()({
      name: 'test_tool',
      description: 'Test tool.',
      inputSchema: z.object({}),
      handler: () => jsonResult({ ok: true }),
    });
    const app = createMcpServer({
      identity: { name: 'testing-server', version: '1.0.0' },
      plugins: [definePlugin({ name: 'test_plugin', version: '1.0.0', features: [tool] })],
      createContext: () => ({}),
    });
    const connection = await connectTestClient(app);
    expect((await connection.client.listTools()).tools).toHaveLength(1);
    await connection.close();
    await connection.close();
    expect(app.state).toBe(McpApplicationState.STOPPED);
  });
});
