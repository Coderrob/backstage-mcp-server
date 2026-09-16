/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { getDefaultEnvironment, StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const TEST_TOKEN = 'all-tools-smoke-token';
const ENTITY_REF = 'component:default/smoke-service';
const ENTITY_UID = '123e4567-e89b-12d3-a456-426614174000';
const LOCATION_ID = 'smoke-location';
const LOCATION_TARGET = 'https://example.test/catalog-info.yaml';
const LOCATION_REF = `url:${LOCATION_TARGET}`;
const ENTITY = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'smoke-service', namespace: 'default', uid: ENTITY_UID },
  spec: { type: 'service', lifecycle: 'test', owner: 'testing' },
};
const LOCATION = { id: LOCATION_ID, type: 'url', target: LOCATION_TARGET };
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
const EXPECTED_REQUESTS = [
  'POST /api/catalog/locations',
  'GET /api/catalog/entities/by-query',
  'GET /api/catalog/entities/by-query',
  'POST /api/catalog/entities/by-refs',
  'GET /api/catalog/entities/by-name/component/default/smoke-service/ancestry',
  'GET /api/catalog/entities/by-name/component/default/smoke-service',
  'GET /api/catalog/entity-facets',
  'GET /api/catalog/locations/by-entity/component/default/smoke-service',
  'GET /api/catalog/locations',
  'POST /api/catalog/refresh',
  `DELETE /api/catalog/entities/by-uid/${ENTITY_UID}`,
  `DELETE /api/catalog/locations/${LOCATION_ID}`,
  'POST /api/catalog/validate-entity',
];
const ROUTES = new Map([
  ['POST /api/catalog/locations', { status: 201, body: { location: LOCATION, entities: [ENTITY], exists: false } }],
  ['GET /api/catalog/entities/by-query', { status: 200, body: { items: [ENTITY], totalItems: 1, pageInfo: {} } }],
  ['POST /api/catalog/entities/by-refs', { status: 200, body: { items: [ENTITY] } }],
  [
    'GET /api/catalog/entities/by-name/component/default/smoke-service/ancestry',
    { status: 200, body: { rootEntityRef: ENTITY_REF, items: [{ entity: ENTITY, parentEntityRefs: [] }] } },
  ],
  ['GET /api/catalog/entities/by-name/component/default/smoke-service', { status: 200, body: ENTITY }],
  ['GET /api/catalog/entity-facets', { status: 200, body: { facets: { kind: [{ value: 'Component', count: 1 }] } } }],
  ['GET /api/catalog/locations/by-entity/component/default/smoke-service', { status: 200, body: LOCATION }],
  ['GET /api/catalog/locations', { status: 200, body: [{ data: LOCATION }] }],
  ['POST /api/catalog/refresh', { status: 200, body: {} }],
  [`DELETE /api/catalog/entities/by-uid/${ENTITY_UID}`, { status: 204 }],
  [`DELETE /api/catalog/locations/${LOCATION_ID}`, { status: 204 }],
  ['POST /api/catalog/validate-entity', { status: 200, body: {} }],
]);

/**
 * Sends one JSON response from the deterministic Catalog stub.
 * @param response - HTTP response to complete.
 * @param status - Response status code.
 * @param body - JSON-compatible response body.
 */
function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

/**
 * Sends a configured Catalog route response.
 * @param response - HTTP response to complete.
 * @param route - Matching response definition, if registered.
 */
function sendRoute(response, route) {
  if (!route) {
    sendJson(response, 404, { error: 'Unexpected Catalog route' });
    return;
  }
  if (route.body === undefined) {
    response.writeHead(route.status);
    response.end();
    return;
  }
  sendJson(response, route.status, route.body);
}

/**
 * Handles a request from the MCP server and records proof of the HTTP boundary.
 * @param request - Incoming request from the server process.
 * @param response - HTTP response to complete.
 * @param requests - Mutable per-test request log.
 */
function handleCatalogRequest(request, response, requests) {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const key = `${request.method} ${url.pathname}`;
  requests.push({ key, url, authorization: request.headers.authorization });
  if (request.headers.authorization !== `Bearer ${TEST_TOKEN}`) {
    sendJson(response, 401, { error: 'Missing smoke-test credential' });
    return;
  }
  sendRoute(response, ROUTES.get(key));
}

/**
 * Closes an HTTP server after active connections finish.
 * @param server - Server to close.
 */
async function closeServer(server) {
  server.close();
  await once(server, 'close');
}

/**
 * Starts the deterministic Catalog API boundary.
 * @returns Stub URL, captured requests, and cleanup function.
 */
async function startCatalogStub() {
  const requests = [];
  const server = createServer(
    /** Routes one request from the built MCP server. */ (request, response) =>
      handleCatalogRequest(request, response, requests)
  );
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string', 'Could not determine the Catalog stub address');
  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    /** Stops the deterministic Catalog API boundary. */
    async close() {
      await closeServer(server);
    },
  };
}

/**
 * Creates an official MCP client transport for the packaged stdio server.
 * @param baseUrl - URL of the deterministic Catalog stub.
 * @returns Stdio transport connected to the built CLI when opened.
 */
function createMcpTransport(baseUrl) {
  return new StdioClientTransport({
    command: process.execPath,
    args: ['dist/cli.cjs'],
    cwd: process.cwd(),
    env: {
      ...getDefaultEnvironment(),
      BACKSTAGE_BASE_URL: baseUrl,
      BACKSTAGE_TOKEN: TEST_TOKEN,
      LOG_LEVEL: 'warn',
    },
    stderr: 'pipe',
  });
}

/**
 * Calls one tool through MCP and requires a successful structured response.
 * @param client - Connected official MCP client.
 * @param name - Registered tool name.
 * @param args - Tool input arguments.
 */
async function callTool(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  assert.notEqual(result.isError, true, `${name} returned ${JSON.stringify(result.structuredContent)}`);
  assert.equal(result.structuredContent?.status, 'success', `${name} did not return structured success`);
}

/**
 * Calls every advertised Catalog tool through MCP exactly once.
 * @param client - Connected official MCP client.
 */
async function callAllTools(client) {
  await callTool(client, 'add_location', { type: 'url', target: LOCATION_TARGET, dryRun: true });
  await callTool(client, 'get_entities', { limit: 1 });
  await callTool(client, 'get_entities_by_query', { filter: { kind: 'Component' }, limit: 1 });
  await callTool(client, 'get_entities_by_refs', { entityRefs: [ENTITY_REF] });
  await callTool(client, 'get_entity_ancestors', { entityRef: ENTITY_REF });
  await callTool(client, 'get_entity_by_ref', { entityRef: ENTITY_REF });
  await callTool(client, 'get_entity_facets', { facets: ['kind'] });
  await callTool(client, 'get_location_by_entity', { entityRef: ENTITY_REF });
  await callTool(client, 'get_location_by_ref', { locationRef: LOCATION_REF });
  await callTool(client, 'refresh_entity', { entityRef: ENTITY_REF });
  await callTool(client, 'remove_entity_by_uid', { uid: ENTITY_UID });
  await callTool(client, 'remove_location_by_id', { locationId: LOCATION_ID });
  await callTool(client, 'validate_entity', { entity: ENTITY, locationRef: LOCATION_REF });
}

/**
 * Verifies every expected authenticated HTTP request was made by the server.
 * @param requests - Requests captured by the isolated Catalog stub.
 */
function assertCatalogRequests(requests) {
  assert.deepEqual(
    requests.map(/** Selects the HTTP method and path. */ ({ key }) => key),
    EXPECTED_REQUESTS
  );
  assert.equal(
    requests.every(
      /** Confirms the child server authenticated every Catalog request. */ ({ authorization }) =>
        authorization === `Bearer ${TEST_TOKEN}`
    ),
    true
  );
  const locationRequest = requests[0];
  assert.equal(locationRequest.url.searchParams.get('dryRun'), 'true');
}

/**
 * Runs the complete packaged-process MCP tool smoke test.
 */
async function main() {
  const stub = await startCatalogStub();
  const client = new Client({ name: 'all-tools-smoke-test', version: '1.0.0' });
  try {
    await client.connect(createMcpTransport(stub.url));
    const listed = await client.listTools();
    assert.deepEqual(
      listed.tools.map(/** Selects one advertised MCP tool name. */ ({ name }) => name),
      EXPECTED_TOOLS
    );
    await callAllTools(client);
    assertCatalogRequests(stub.requests);
    process.stdout.write('All-tools MCP smoke test passed (13 MCP calls, 13 authenticated Catalog requests)\n');
  } finally {
    await client.close();
    await stub.close();
  }
}

await main();
