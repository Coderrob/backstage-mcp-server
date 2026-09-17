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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { McpTransportName } from '../shared/constants/mcp-protocol.js';
import type { McpTestConnection } from '../types/mcp.js';
import type { McpApplication } from './application.js';
import { defineTransport } from './transports.js';

export type { McpTestConnection } from '../types/mcp.js';

const MCP_TEST_CLIENT_NAME = 'mcp-harness-test-client';
const MCP_TEST_CLIENT_VERSION = '1.0.0';
const TEST_COMPLETE_STOP_REASON = 'test-complete';

/**
 * Starts an application on linked in-memory transports and connects an SDK client.
 * @param app - Application under test.
 * @returns A client and an idempotent cleanup boundary for contract tests.
 */
export async function connectTestClient<TContext>(app: Readonly<McpApplication<TContext>>): Promise<McpTestConnection> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await app.start(
    defineTransport(McpTransportName.IN_MEMORY, /** Creates the transport instance. */ () => serverTransport)
  );

  const client = new Client({ name: MCP_TEST_CLIENT_NAME, version: MCP_TEST_CLIENT_VERSION });
  await client.connect(clientTransport);

  return {
    client,
    /**
     * Closes the SDK client and stops the application.
     */
    async close(): Promise<void> {
      await client.close();
      await app.stop(TEST_COMPLETE_STOP_REASON);
    },
  };
}
