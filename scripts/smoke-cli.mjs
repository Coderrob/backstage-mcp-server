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

const AUTH_VALUE = 'fixture-value';
const SMOKE_ENTITY_NAME = 'smoke-test';

let requestVerified = false;
const upstream = createServer(
  /** Serves the deterministic Catalog API response expected by the CLI. */ (request, response) => {
    if (
      request.url !== CATALOG_QUERY_PATH ||
      request.headers[HTTP_HEADER.AUTHORIZATION] !== `${HTTP_AUTHORIZATION_SCHEME.BEARER} ${AUTH_VALUE}`
    ) {
      response.writeHead(HTTP_STATUS.BAD_REQUEST, { [HTTP_HEADER.CONTENT_TYPE]: MIME_TYPE.JSON });
      response.end(JSON.stringify({ error: 'Unexpected request' }));
      return;
    }
    requestVerified = true;
    response.writeHead(HTTP_STATUS.OK, { [HTTP_HEADER.CONTENT_TYPE]: MIME_TYPE.JSON });
    response.end(
      JSON.stringify({
        items: [{ kind: 'Component', metadata: { name: SMOKE_ENTITY_NAME } }],
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
    [BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN]: AUTH_VALUE,
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
  if (called.isError || called.structuredContent?.data?.items?.[0]?.metadata?.name !== SMOKE_ENTITY_NAME) {
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
