/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { createServer } from 'node:http';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { getDefaultEnvironment, StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import {
  BACKSTAGE_ENVIRONMENT_VARIABLE,
  CATALOG_QUERY_PATH,
  EXPECTED_MCP_TOOL_NAMES,
  HTTP_AUTHORIZATION_SCHEME,
  HTTP_HEADER,
  HTTP_STATUS,
  LOOPBACK_HOST,
  MCP_TOOL_NAME,
  MIME_TYPE,
  PACKAGED_SERVER_ENTRY,
  PROCESS_LOG_LEVEL,
  SMOKE_CLIENT_VERSION,
  STDERR_MODE,
} from './mcp-smoke-constants.mjs';

const TEST_TOKEN = 'smoke-test-token';

let requestVerified = false;
const upstream = createServer(
  /** Serves the deterministic Catalog API response expected by the CLI. */ (request, response) => {
    if (
      request.url !== CATALOG_QUERY_PATH ||
      request.headers[HTTP_HEADER.AUTHORIZATION] !== `${HTTP_AUTHORIZATION_SCHEME.BEARER} ${TEST_TOKEN}`
    ) {
      response.writeHead(HTTP_STATUS.BAD_REQUEST, { [HTTP_HEADER.CONTENT_TYPE]: MIME_TYPE.JSON });
      response.end(JSON.stringify({ error: 'Unexpected request' }));
      return;
    }
    requestVerified = true;
    response.writeHead(HTTP_STATUS.OK, { [HTTP_HEADER.CONTENT_TYPE]: MIME_TYPE.JSON });
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
    upstream.listen(0, LOOPBACK_HOST, resolve);
  }
);
const address = upstream.address();
if (!address || typeof address === 'string') throw new Error('Could not determine smoke-test server address');

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [PACKAGED_SERVER_ENTRY],
  cwd: process.cwd(),
  env: {
    ...getDefaultEnvironment(),
    [BACKSTAGE_ENVIRONMENT_VARIABLE.BASE_URL]: `http://${LOOPBACK_HOST}:${address.port}`,
    [BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN]: TEST_TOKEN,
    [BACKSTAGE_ENVIRONMENT_VARIABLE.LOG_LEVEL]: PROCESS_LOG_LEVEL.INFO,
  },
  stderr: STDERR_MODE,
});

const client = new Client({ name: 'cli-smoke-test', version: SMOKE_CLIENT_VERSION });

try {
  await client.connect(transport);
  const result = await client.listTools();
  const names = result.tools.map(/** Selects an advertised tool name. */ ({ name }) => name);
  if (JSON.stringify(names) !== JSON.stringify(EXPECTED_MCP_TOOL_NAMES)) {
    throw new Error(`Unexpected CLI tool list: ${JSON.stringify(names)}`);
  }
  const called = await client.callTool({ name: MCP_TOOL_NAME.GET_ENTITIES, arguments: { limit: 1 } });
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
