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
