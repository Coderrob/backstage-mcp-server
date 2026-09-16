/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { getDefaultEnvironment, StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

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
 * Reads the required live Backstage base URL.
 * @returns Configured Backstage backend URL.
 * @throws {Error} When the URL is not configured.
 */
function backstageBaseUrl() {
  const baseUrl = process.env.BACKSTAGE_BASE_URL;
  if (!baseUrl) throw new Error('BACKSTAGE_BASE_URL is required for the live integration test');
  return baseUrl;
}

/**
 * Selects one supported credential source without logging its value.
 * @returns Token environment passed to the child process.
 * @throws {Error} When neither supported credential source is configured.
 */
function credentialEnvironment() {
  const token = process.env.BACKSTAGE_TOKEN;
  if (token) return { BACKSTAGE_TOKEN: token };
  const tokenFile = process.env.BACKSTAGE_TOKEN_FILE;
  if (tokenFile) return { BACKSTAGE_TOKEN_FILE: tokenFile };
  throw new Error('BACKSTAGE_TOKEN or BACKSTAGE_TOKEN_FILE is required for the live test');
}

/**
 * Reads the live integration configuration without logging credentials.
 * @returns Environment passed to the MCP server child process.
 */
function liveEnvironment() {
  return {
    ...getDefaultEnvironment(),
    BACKSTAGE_BASE_URL: backstageBaseUrl(),
    ...credentialEnvironment(),
    LOG_LEVEL: 'warn',
  };
}

/**
 * Requires the live server to publish exactly the supported tool surface.
 * @param names - Advertised tool names.
 * @throws {Error} When the tool list differs from the supported surface.
 */
function assertExpectedTools(names) {
  if (JSON.stringify(names) !== JSON.stringify(EXPECTED_TOOLS)) {
    throw new Error(`Unexpected live MCP tool list: ${JSON.stringify(names)}`);
  }
}

/**
 * Reports whether an MCP result is a successful structured response.
 * @param result - MCP tool result returned by the server.
 * @returns Whether the result is successful.
 */
function isSuccessfulRead(result) {
  return result.isError !== true && result.structuredContent?.status === 'success';
}

/**
 * Requires a successful structured result from the live read operation.
 * @param result - MCP tool result returned by the server.
 * @throws {Error} When the live read fails.
 */
function assertSuccessfulRead(result) {
  if (!isSuccessfulRead(result)) {
    throw new Error(`Live get_entities failed: ${JSON.stringify(result)}`);
  }
}

/**
 * Validates the built MCP server against a configured live Backstage instance.
 * @throws {Error} When discovery or the live read fails.
 */
async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['dist/cli.cjs'],
    cwd: process.cwd(),
    env: liveEnvironment(),
    stderr: 'pipe',
  });
  const client = new Client({ name: 'live-backstage-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    const names = listed.tools.map(/** Selects one advertised tool name. */ ({ name }) => name);
    assertExpectedTools(names);
    const result = await client.callTool({ name: 'get_entities', arguments: { limit: 1 } });
    assertSuccessfulRead(result);
    process.stdout.write(`Live Backstage MCP test passed (${names.length} tools, one read-only call)\n`);
  } finally {
    await client.close();
  }
}

await main();
