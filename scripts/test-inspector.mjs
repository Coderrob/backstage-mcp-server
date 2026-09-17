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

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

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
  NODE_EVENT,
  PACKAGED_SERVER_ENTRY,
  PROCESS_LOG_LEVEL,
} from './mcp-smoke-constants.mjs';

const execFileAsync = promisify(execFile);
const CHILD_PROCESS_MAX_BUFFER_BYTES = 1024 * 1024;
const CHILD_PROCESS_TIMEOUT_MS = 30_000;
const INSPECTOR_METHOD = Object.freeze({ LIST_TOOLS: 'tools/list', CALL_TOOL: 'tools/call' });
const INSPECTOR_ENVIRONMENT_VARIABLE = Object.freeze({
  AUTO_OPEN_ENABLED: 'MCP_AUTO_OPEN_ENABLED',
  CATALOG_PATH: 'MCP_CATALOG_PATH',
  CLIENT_CONFIG_PATH: 'MCP_CLIENT_CONFIG_PATH',
  STORAGE_DIRECTORY: 'MCP_STORAGE_DIR',
});
const AUTH_VALUE = 'fixture-value';
const TOOL_CALL_ARGUMENTS = Object.freeze([
  '--method',
  INSPECTOR_METHOD.CALL_TOOL,
  '--tool-name',
  MCP_TOOL_NAME.GET_ENTITIES,
  '--tool-args-json',
  '{"limit":1}',
]);
const INSPECTOR_ENTRY = resolve(
  'node_modules',
  '@modelcontextprotocol',
  'inspector',
  'clients',
  'launcher',
  'build',
  'index.js'
);
const SERVER_ENTRY = resolve(PACKAGED_SERVER_ENTRY);

/**
 * Closes an HTTP server after all active connections finish.
 * @param server - HTTP server to close.
 */
async function closeServer(server) {
  server.close();
  await once(server, NODE_EVENT.CLOSE);
}

/**
 * Creates the public handle for a running Catalog stub.
 * @param server - Running HTTP server.
 * @param port - Ephemeral port selected by the operating system.
 * @param wasRequestVerified - Callback exposing request validation state.
 * @returns Catalog stub URL, verification state, and cleanup boundary.
 */
function createStubHandle(server, port, wasRequestVerified) {
  return {
    url: `http://${LOOPBACK_HOST}:${port}`,
    wasRequestVerified,
    /** Stops the Backstage Catalog stub. */
    async close() {
      await closeServer(server);
    },
  };
}

/**
 * Handles one request received by the deterministic Catalog stub.
 * @param request - Incoming HTTP request.
 * @param response - HTTP response used to return Catalog data.
 * @param markVerified - Callback recording a valid authenticated request.
 */
function handleCatalogRequest(request, response, markVerified) {
  if (
    request.url !== CATALOG_QUERY_PATH ||
    request.headers[HTTP_HEADER.AUTHORIZATION] !== `${HTTP_AUTHORIZATION_SCHEME.BEARER} ${AUTH_VALUE}`
  ) {
    response.writeHead(HTTP_STATUS.BAD_REQUEST, { [HTTP_HEADER.CONTENT_TYPE]: MIME_TYPE.JSON });
    response.end(JSON.stringify({ error: 'Unexpected request' }));
    return;
  }

  markVerified();
  response.writeHead(HTTP_STATUS.OK, { [HTTP_HEADER.CONTENT_TYPE]: MIME_TYPE.JSON });
  response.end(
    JSON.stringify({
      items: [{ kind: 'Component', metadata: { name: 'inspector-test' } }],
      totalItems: 1,
      pageInfo: {},
    })
  );
}

/**
 * Builds the Inspector launcher arguments for one protocol method.
 * @param baseUrl - URL of the deterministic Backstage Catalog stub.
 * @param methodArguments - Inspector method and input arguments.
 * @returns Complete launcher argument collection.
 */
function inspectorArguments(baseUrl, methodArguments) {
  return [
    INSPECTOR_ENTRY,
    '--cli',
    process.execPath,
    SERVER_ENTRY,
    ...methodArguments,
    '--format',
    'json',
    '-e',
    `${BACKSTAGE_ENVIRONMENT_VARIABLE.BASE_URL}=${baseUrl}`,
    '-e',
    `${BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN}=${AUTH_VALUE}`,
    '-e',
    `${BACKSTAGE_ENVIRONMENT_VARIABLE.LOG_LEVEL}=${PROCESS_LOG_LEVEL.INFO}`,
  ];
}

/**
 * Builds isolated execution options for the Inspector launcher.
 * @param stateDirectory - Directory for Inspector state files.
 * @returns Child-process execution options.
 */
function inspectorOptions(stateDirectory) {
  return {
    cwd: process.cwd(),
    env: {
      ...process.env,
      [INSPECTOR_ENVIRONMENT_VARIABLE.AUTO_OPEN_ENABLED]: 'false',
      [INSPECTOR_ENVIRONMENT_VARIABLE.CATALOG_PATH]: join(stateDirectory, 'catalog.json'),
      [INSPECTOR_ENVIRONMENT_VARIABLE.CLIENT_CONFIG_PATH]: join(stateDirectory, 'client.json'),
      [INSPECTOR_ENVIRONMENT_VARIABLE.STORAGE_DIRECTORY]: stateDirectory,
    },
    maxBuffer: CHILD_PROCESS_MAX_BUFFER_BYTES,
    timeout: CHILD_PROCESS_TIMEOUT_MS,
  };
}

/**
 * Verifies schema discovery and a real authenticated tool invocation through MCP Inspector.
 */
async function main() {
  const stub = await startBackstageStub();
  const stateDirectory = await mkdtemp(join(tmpdir(), 'backstage-mcp-inspector-'));
  try {
    const listed = await runInspector(stub.url, ['--method', INSPECTOR_METHOD.LIST_TOOLS, '--strict'], stateDirectory);
    assert.deepEqual(
      listed.tools.map(/** Selects each advertised tool name. */ (tool) => tool.name),
      EXPECTED_MCP_TOOL_NAMES
    );

    const called = await runInspector(stub.url, TOOL_CALL_ARGUMENTS, stateDirectory);
    assert.notEqual(called.isError, true, JSON.stringify(called));
    assert.equal(called.structuredContent.data.items[0].metadata.name, 'inspector-test');
    assert.equal(stub.wasRequestVerified(), true, 'Inspector tool call did not reach the authenticated catalog stub');

    process.stdout.write(`MCP Inspector test passed (${listed.tools.length} portable tools, one tool call)\n`);
  } finally {
    await stub.close();
    await rm(stateDirectory, { recursive: true, force: true });
  }
}

/**
 * Executes one MCP Inspector CLI method against the built stdio server.
 * @param baseUrl - URL of the deterministic Backstage Catalog stub.
 * @param methodArguments - Inspector arguments selecting the MCP method and inputs.
 * @param stateDirectory - Isolated directory for Inspector configuration and authentication state.
 * @returns The protocol result emitted by MCP Inspector.
 */
async function runInspector(baseUrl, methodArguments, stateDirectory) {
  const { stdout } = await execFileAsync(process.execPath, inspectorArguments(baseUrl, methodArguments), {
    ...inspectorOptions(stateDirectory),
  });
  const envelope = JSON.parse(stdout.trim());
  assert('result' in envelope, `Inspector did not return a result envelope: ${stdout}`);
  return envelope.result;
}

/**
 * Starts a deterministic Backstage Catalog stub for the Inspector tool-call test.
 * @returns The stub URL, request-verification state, and cleanup function.
 */
async function startBackstageStub() {
  let requestVerified = false;
  const server = createServer(
    /** Serves the catalog response expected from the MCP tool invocation. */ (request, response) =>
      handleCatalogRequest(
        request,
        response,
        /** Records successful validation of the stub request. */ () => {
          requestVerified = true;
        }
      )
  );

  server.listen(0, LOOPBACK_HOST);
  await once(server, NODE_EVENT.LISTENING);
  const address = server.address();
  assert(address && typeof address !== 'string', 'Could not determine the Inspector test server address');

  return createStubHandle(
    server,
    address.port,
    /** Reports whether the expected authenticated catalog request was received. */ () => requestVerified
  );
}

await main();
