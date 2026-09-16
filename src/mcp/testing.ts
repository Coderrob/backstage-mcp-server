/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import type { McpApplication } from './application.js';
import { defineTransport } from './transports.js';

/** Official SDK client connection paired with an in-memory server transport. */
export interface McpTestConnection {
  client: Client;
  close(): Promise<void>;
}

/**
 * Starts an application on linked in-memory transports and connects an SDK client.
 * @param app - Application under test.
 * @returns A client and an idempotent cleanup boundary for contract tests.
 */
export async function connectTestClient<TContext>(app: Readonly<McpApplication<TContext>>): Promise<McpTestConnection> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await app.start(defineTransport('in-memory', /** Creates the transport instance. */ () => serverTransport));

  const client = new Client({ name: 'mcp-harness-test-client', version: '1.0.0' });
  await client.connect(clientTransport);

  return {
    client,
    /**
     * Closes the SDK client and stops the application.
     */
    async close(): Promise<void> {
      await client.close();
      await app.stop('test-complete');
    },
  };
}
