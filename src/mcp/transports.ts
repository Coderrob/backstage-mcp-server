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

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

import { McpTransportName } from '../shared/constants/mcp-protocol.js';
import type { McpTransportFactory } from '../types/mcp.js';

export type { McpTransportFactory } from '../types/mcp.js';

/**
 * Creates an immutable transport factory.
 * @param name - Transport name exposed in request metadata and logs.
 * @param create - Factory that returns a fresh SDK transport.
 * @returns A reusable transport factory definition.
 */
export function defineTransport(name: string, create: () => Transport): McpTransportFactory {
  return Object.freeze({ name, create });
}

/**
 * Creates a factory for the MCP SDK stdio server transport.
 * @returns A stdio transport factory suitable for CLI execution.
 */
export function stdioTransport(): McpTransportFactory {
  return defineTransport(
    McpTransportName.STDIO,
    /** Creates the transport instance. */ () => new StdioServerTransport()
  );
}
