/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

/** Lazily creates a named SDK transport for an application instance. */
export interface McpTransportFactory {
  readonly name: string;
  create(): Transport;
}

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
  return defineTransport('stdio', /** Creates the transport instance. */ () => new StdioServerTransport());
}
