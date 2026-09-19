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
import { getDefaultEnvironment, StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import {
  BACKSTAGE_ENVIRONMENT_VARIABLE,
  EXPECTED_MCP_TOOL_NAMES,
  MCP_RESULT_STATUS,
  MCP_TOOL_NAME,
  PACKAGED_SERVER_ENTRY,
  PROCESS_LOG_LEVEL,
  SMOKE_CLIENT_VERSION,
  STDERR_MODE,
} from './mcp-smoke-constants.mjs';

/**
 * Requires the live server to publish exactly the supported tool surface.
 * @param names - Advertised tool names.
 * @throws {Error} When the tool list differs from the supported surface.
 */
function assertExpectedTools(names) {
  if (JSON.stringify(names) !== JSON.stringify(EXPECTED_MCP_TOOL_NAMES)) {
    throw new Error(`Unexpected live MCP tool list: ${JSON.stringify(names)}`);
  }
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
 * Reads the required live Backstage base URL.
 * @returns Configured Backstage backend URL.
 * @throws {Error} When the URL is not configured.
 */
function backstageBaseUrl() {
  const baseUrl = process.env[BACKSTAGE_ENVIRONMENT_VARIABLE.BASE_URL];
  if (!baseUrl) {
    throw new Error(`${BACKSTAGE_ENVIRONMENT_VARIABLE.BASE_URL} is required for the live integration test`);
  }
  return baseUrl;
}

/**
 * Selects one supported credential source without logging its value.
 * @returns Token environment passed to the child process.
 * @throws {Error} When neither supported credential source is configured.
 */
function credentialEnvironment() {
  const token = process.env[BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN];
  if (token) return { [BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN]: token };
  const tokenFile = process.env[BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN_FILE];
  if (tokenFile) return { [BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN_FILE]: tokenFile };
  throw new Error(
    `${BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN} or ${BACKSTAGE_ENVIRONMENT_VARIABLE.TOKEN_FILE} is required for the live test`
  );
}

/**
 * Reports whether an MCP result is a successful structured response.
 * @param result - MCP tool result returned by the server.
 * @returns Whether the result is successful.
 */
function isSuccessfulRead(result) {
  return !result.isError && result.structuredContent?.status === MCP_RESULT_STATUS.SUCCESS;
}

/**
 * Reads the live integration configuration without logging credentials.
 * @returns Environment passed to the MCP server child process.
 */
function liveEnvironment() {
  return {
    ...getDefaultEnvironment(),
    [BACKSTAGE_ENVIRONMENT_VARIABLE.BASE_URL]: backstageBaseUrl(),
    ...credentialEnvironment(),
    [BACKSTAGE_ENVIRONMENT_VARIABLE.LOG_LEVEL]: PROCESS_LOG_LEVEL.WARN,
  };
}

/**
 * Validates the built MCP server against a configured live Backstage instance.
 * @throws {Error} When discovery or the live read fails.
 */
async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [PACKAGED_SERVER_ENTRY],
    cwd: process.cwd(),
    env: liveEnvironment(),
    stderr: STDERR_MODE,
  });
  const client = new Client({ name: 'live-backstage-test', version: SMOKE_CLIENT_VERSION });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    const names = listed.tools.map(/** Selects one advertised tool name. */ ({ name }) => name);
    assertExpectedTools(names);
    const result = await client.callTool({ name: MCP_TOOL_NAME.GET_ENTITIES, arguments: { limit: 1 } });
    assertSuccessfulRead(result);
    process.stdout.write(`Live Backstage MCP test passed (${names.length} tools, one read-only call)\n`);
  } finally {
    await client.close();
  }
}

await main();
