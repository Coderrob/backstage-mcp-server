/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const INSPECTOR_ENTRY = resolve(
  'node_modules',
  '@modelcontextprotocol',
  'inspector',
  'clients',
  'launcher',
  'build',
  'index.js'
);
const SERVER_ENTRY = resolve('dist', 'cli.cjs');
const EXPECTED_TOOLS = [
  'add_location',
  'get_entities',
  'get_entities_by_query',
  'get_entities_by_refs',
  'get_entity_ancestors',
  'get_entity_by_ref',
  'get_entity_facets',
  'get_location_by_entity',
  'get_location_by_ref',
  'refresh_entity',
  'remove_entity_by_uid',
  'remove_location_by_id',
  'validate_entity',
];

/**
 * Handles one request received by the deterministic Catalog stub.
 * @param request - Incoming HTTP request.
 * @param response - HTTP response used to return Catalog data.
 * @param markVerified - Callback recording a valid authenticated request.
 */
function handleCatalogRequest(request, response, markVerified) {
  if (
    request.url !== '/api/catalog/entities/by-query?limit=1' ||
    request.headers.authorization !== 'Bearer inspector-test-token'
  ) {
    response.writeHead(400, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'Unexpected request' }));
    return;
  }

  markVerified();
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(
    JSON.stringify({
      items: [{ kind: 'Component', metadata: { name: 'inspector-test' } }],
      totalItems: 1,
      pageInfo: {},
    })
  );
}

/**
 * Closes an HTTP server after all active connections finish.
 * @param server - HTTP server to close.
 */
async function closeServer(server) {
  server.close();
  await once(server, 'close');
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
    url: `http://127.0.0.1:${port}`,
    wasRequestVerified,
    /** Stops the Backstage Catalog stub. */
    async close() {
      await closeServer(server);
    },
  };
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

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string', 'Could not determine the Inspector test server address');

  return createStubHandle(
    server,
    address.port,
    /** Reports whether the expected authenticated catalog request was received. */ () => requestVerified
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
    `BACKSTAGE_BASE_URL=${baseUrl}`,
    '-e',
    'BACKSTAGE_TOKEN=inspector-test-token',
    '-e',
    'LOG_LEVEL=info',
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
      MCP_AUTO_OPEN_ENABLED: 'false',
      MCP_CATALOG_PATH: join(stateDirectory, 'catalog.json'),
      MCP_CLIENT_CONFIG_PATH: join(stateDirectory, 'client.json'),
      MCP_STORAGE_DIR: stateDirectory,
    },
    maxBuffer: 1024 * 1024,
    timeout: 30_000,
  };
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
 * Verifies schema discovery and a real authenticated tool invocation through MCP Inspector.
 */
async function main() {
  const stub = await startBackstageStub();
  const stateDirectory = await mkdtemp(join(tmpdir(), 'backstage-mcp-inspector-'));
  try {
    const listed = await runInspector(stub.url, ['--method', 'tools/list', '--strict'], stateDirectory);
    assert.deepEqual(
      listed.tools.map(/** Selects each advertised tool name. */ (tool) => tool.name),
      EXPECTED_TOOLS
    );

    const called = await runInspector(
      stub.url,
      ['--method', 'tools/call', '--tool-name', 'get_entities', '--tool-args-json', '{"limit":1}'],
      stateDirectory
    );
    assert.notEqual(called.isError, true, JSON.stringify(called));
    assert.equal(called.structuredContent.data.items[0].metadata.name, 'inspector-test');
    assert.equal(stub.wasRequestVerified(), true, 'Inspector tool call did not reach the authenticated catalog stub');

    process.stdout.write(`MCP Inspector test passed (${listed.tools.length} portable tools, one tool call)\n`);
  } finally {
    await stub.close();
    await rm(stateDirectory, { recursive: true, force: true });
  }
}

await main();
