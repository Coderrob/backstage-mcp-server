/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { getDefaultEnvironment, StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import {
  BACKSTAGE_ENVIRONMENT_VARIABLE,
  EXPECTED_MCP_TOOL_NAMES,
  HTTP_AUTHORIZATION_SCHEME,
  HTTP_HEADER,
  HTTP_STATUS,
  LOOPBACK_HOST,
  MCP_RESULT_STATUS,
  MCP_TOOL_NAME,
  MIME_TYPE,
  NODE_EVENT,
  PACKAGED_SERVER_ENTRY,
  PROCESS_LOG_LEVEL,
  SMOKE_CLIENT_VERSION,
  STDERR_MODE,
} from './mcp-smoke-constants.mjs';

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
const CATALOG_REQUEST = Object.freeze({
  ADD_LOCATION: 'POST /api/catalog/locations',
  GET_ENTITIES: 'GET /api/catalog/entities/by-query',
  GET_ENTITIES_BY_REFS: 'POST /api/catalog/entities/by-refs',
  GET_ENTITY_ANCESTORS: 'GET /api/catalog/entities/by-name/component/default/smoke-service/ancestry',
  GET_ENTITY_BY_REF: 'GET /api/catalog/entities/by-name/component/default/smoke-service',
  GET_ENTITY_FACETS: 'GET /api/catalog/entity-facets',
  GET_LOCATION_BY_ENTITY: 'GET /api/catalog/locations/by-entity/component/default/smoke-service',
  GET_LOCATION_BY_REF: 'GET /api/catalog/locations',
  REFRESH_ENTITY: 'POST /api/catalog/refresh',
  REMOVE_ENTITY_BY_UID: `DELETE /api/catalog/entities/by-uid/${ENTITY_UID}`,
  REMOVE_LOCATION_BY_ID: `DELETE /api/catalog/locations/${LOCATION_ID}`,
  VALIDATE_ENTITY: 'POST /api/catalog/validate-entity',
});
const EXPECTED_REQUESTS = [
  CATALOG_REQUEST.ADD_LOCATION,
  CATALOG_REQUEST.GET_ENTITIES,
  CATALOG_REQUEST.GET_ENTITIES,
  CATALOG_REQUEST.GET_ENTITIES_BY_REFS,
  CATALOG_REQUEST.GET_ENTITY_ANCESTORS,
  CATALOG_REQUEST.GET_ENTITY_BY_REF,
  CATALOG_REQUEST.GET_ENTITY_FACETS,
  CATALOG_REQUEST.GET_LOCATION_BY_ENTITY,
  CATALOG_REQUEST.GET_LOCATION_BY_REF,
  CATALOG_REQUEST.REFRESH_ENTITY,
  CATALOG_REQUEST.REMOVE_ENTITY_BY_UID,
  CATALOG_REQUEST.REMOVE_LOCATION_BY_ID,
  CATALOG_REQUEST.VALIDATE_ENTITY,
];
const ROUTES = new Map([
  [
    CATALOG_REQUEST.ADD_LOCATION,
    { status: HTTP_STATUS.CREATED, body: { location: LOCATION, entities: [ENTITY], exists: false } },
  ],
  [CATALOG_REQUEST.GET_ENTITIES, { status: HTTP_STATUS.OK, body: { items: [ENTITY], totalItems: 1, pageInfo: {} } }],
  [CATALOG_REQUEST.GET_ENTITIES_BY_REFS, { status: HTTP_STATUS.OK, body: { items: [ENTITY] } }],
  [
    CATALOG_REQUEST.GET_ENTITY_ANCESTORS,
    {
      status: HTTP_STATUS.OK,
      body: { rootEntityRef: ENTITY_REF, items: [{ entity: ENTITY, parentEntityRefs: [] }] },
    },
  ],
  [CATALOG_REQUEST.GET_ENTITY_BY_REF, { status: HTTP_STATUS.OK, body: ENTITY }],
  [
    CATALOG_REQUEST.GET_ENTITY_FACETS,
    { status: HTTP_STATUS.OK, body: { facets: { kind: [{ value: 'Component', count: 1 }] } } },
  ],
  [CATALOG_REQUEST.GET_LOCATION_BY_ENTITY, { status: HTTP_STATUS.OK, body: LOCATION }],
  [CATALOG_REQUEST.GET_LOCATION_BY_REF, { status: HTTP_STATUS.OK, body: [{ data: LOCATION }] }],
  [CATALOG_REQUEST.REFRESH_ENTITY, { status: HTTP_STATUS.OK, body: {} }],
  [CATALOG_REQUEST.REMOVE_ENTITY_BY_UID, { status: HTTP_STATUS.NO_CONTENT }],
  [CATALOG_REQUEST.REMOVE_LOCATION_BY_ID, { status: HTTP_STATUS.NO_CONTENT }],
  [CATALOG_REQUEST.VALIDATE_ENTITY, { status: HTTP_STATUS.OK, body: {} }],
]);

/**
 * Sends one JSON response from the deterministic Catalog stub.
 * @param response - HTTP response to complete.
 * @param status - Response status code.
 * @param body - JSON-compatible response body.
 */
function sendJson(response, status, body) {
  response.writeHead(status, { [HTTP_HEADER.CONTENT_TYPE]: MIME_TYPE.JSON });
  response.end(JSON.stringify(body));
}

/**
 * Sends a configured Catalog route response.
 * @param response - HTTP response to complete.
 * @param route - Matching response definition, if registered.
 */
function sendRoute(response, route) {
  if (!route) {
    sendJson(response, HTTP_STATUS.NOT_FOUND, { error: 'Unexpected Catalog route' });
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
  const url = new URL(request.url ?? '/', `http://${LOOPBACK_HOST}`);
  const key = `${request.method} ${url.pathname}`;
  requests.push({ key, url, authorization: request.headers[HTTP_HEADER.AUTHORIZATION] });
  if (request.headers[HTTP_HEADER.AUTHORIZATION] !== `${HTTP_AUTHORIZATION_SCHEME.BEARER} ${TEST_TOKEN}`) {
    sendJson(response, HTTP_STATUS.UNAUTHORIZED, { error: 'Missing smoke-test credential' });
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
  await once(server, NODE_EVENT.CLOSE);
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
  server.listen(0, LOOPBACK_HOST);
  await once(server, NODE_EVENT.LISTENING);
  const address = server.address();
  assert(address && typeof address !== 'string', 'Could not determine the Catalog stub address');
  return {
    url: `http://${LOOPBACK_HOST}:${address.port}`,
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
    args: [PACKAGED_SERVER_ENTRY],
    cwd: process.cwd(),
    env: {
      ...getDefaultEnvironment(),
      [BACKSTAGE_ENVIRONMENT_VARIABLE.BASE_URL]: baseUrl,
      [BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN]: TEST_TOKEN,
      [BACKSTAGE_ENVIRONMENT_VARIABLE.LOG_LEVEL]: PROCESS_LOG_LEVEL.WARN,
    },
    stderr: STDERR_MODE,
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
  assert.equal(
    result.structuredContent?.status,
    MCP_RESULT_STATUS.SUCCESS,
    `${name} did not return structured success`
  );
}

/**
 * Calls every advertised Catalog tool through MCP exactly once.
 * @param client - Connected official MCP client.
 */
async function callAllTools(client) {
  await callTool(client, MCP_TOOL_NAME.ADD_LOCATION, { type: 'url', target: LOCATION_TARGET, dryRun: true });
  await callTool(client, MCP_TOOL_NAME.GET_ENTITIES, { limit: 1 });
  await callTool(client, MCP_TOOL_NAME.GET_ENTITIES_BY_QUERY, {
    filter: { kind: 'Component' },
    limit: 1,
  });
  await callTool(client, MCP_TOOL_NAME.GET_ENTITIES_BY_REFS, { entityRefs: [ENTITY_REF] });
  await callTool(client, MCP_TOOL_NAME.GET_ENTITY_ANCESTORS, { entityRef: ENTITY_REF });
  await callTool(client, MCP_TOOL_NAME.GET_ENTITY_BY_REF, { entityRef: ENTITY_REF });
  await callTool(client, MCP_TOOL_NAME.GET_ENTITY_FACETS, { facets: ['kind'] });
  await callTool(client, MCP_TOOL_NAME.GET_LOCATION_BY_ENTITY, { entityRef: ENTITY_REF });
  await callTool(client, MCP_TOOL_NAME.GET_LOCATION_BY_REF, { locationRef: LOCATION_REF });
  await callTool(client, MCP_TOOL_NAME.REFRESH_ENTITY, { entityRef: ENTITY_REF });
  await callTool(client, MCP_TOOL_NAME.REMOVE_ENTITY_BY_UID, { uid: ENTITY_UID });
  await callTool(client, MCP_TOOL_NAME.REMOVE_LOCATION_BY_ID, { locationId: LOCATION_ID });
  await callTool(client, MCP_TOOL_NAME.VALIDATE_ENTITY, { entity: ENTITY, locationRef: LOCATION_REF });
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
        authorization === `${HTTP_AUTHORIZATION_SCHEME.BEARER} ${TEST_TOKEN}`
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
  const client = new Client({ name: 'all-tools-smoke-test', version: SMOKE_CLIENT_VERSION });
  try {
    await client.connect(createMcpTransport(stub.url));
    const listed = await client.listTools();
    assert.deepEqual(
      listed.tools.map(/** Selects one advertised MCP tool name. */ ({ name }) => name),
      EXPECTED_MCP_TOOL_NAMES
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
