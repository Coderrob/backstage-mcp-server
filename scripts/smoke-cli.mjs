/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { createServer } from 'node:http';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { getDefaultEnvironment, StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

let requestVerified = false;
const upstream = createServer(
  /** Serves the deterministic Catalog API response expected by the CLI. */ (request, response) => {
    if (
      request.url !== '/api/catalog/entities/by-query?limit=1' ||
      request.headers.authorization !== 'Bearer smoke-test-token'
    ) {
      response.writeHead(400, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'Unexpected request' }));
      return;
    }
    requestVerified = true;
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({
        items: [{ kind: 'Component', metadata: { name: 'smoke-test' } }],
        totalItems: 1,
        pageInfo: {},
      })
    );
  }
);

await new Promise(
  /** Starts the deterministic Catalog API stub. */ (resolve, reject) => {
    upstream.once('error', reject);
    upstream.listen(0, '127.0.0.1', resolve);
  }
);
const address = upstream.address();
if (!address || typeof address === 'string') throw new Error('Could not determine smoke-test server address');

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/cli.cjs'],
  cwd: process.cwd(),
  env: {
    ...getDefaultEnvironment(),
    BACKSTAGE_BASE_URL: `http://127.0.0.1:${address.port}`,
    BACKSTAGE_TOKEN: 'smoke-test-token',
    LOG_LEVEL: 'info',
  },
  stderr: 'pipe',
});

const client = new Client({ name: 'cli-smoke-test', version: '1.0.0' });

try {
  await client.connect(transport);
  const result = await client.listTools();
  const names = result.tools.map(/** Selects an advertised tool name. */ ({ name }) => name);
  const expected = ['add_location', 'get_entities', 'get_entity_by_ref'];
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected CLI tool list: ${JSON.stringify(names)}`);
  }
  const called = await client.callTool({ name: 'get_entities', arguments: { limit: 1 } });
  if (called.isError || called.structuredContent?.data?.items?.[0]?.metadata?.name !== 'smoke-test') {
    throw new Error(`Unexpected CLI tool result: ${JSON.stringify(called)}`);
  }
  if (!requestVerified) throw new Error('The CLI did not call the expected authenticated Backstage endpoint');
  process.stdout.write(`CLI smoke test passed (${names.length} tools, one authenticated call)\n`);
} finally {
  await client.close();
  await new Promise(
    /** Stops the deterministic Catalog API stub. */ (resolve, reject) =>
      upstream.close(
        /** Settles shutdown according to the server close result. */ (error) => (error ? reject(error) : resolve())
      )
  );
}
