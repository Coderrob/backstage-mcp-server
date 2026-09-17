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

/** Lifecycle states exposed by an MCP application instance. */
export enum McpApplicationState {
  CREATED = 'created',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
}

/** Default maximum number of cached tool results retained by one application. */
export const DEFAULT_MCP_CACHE_CAPACITY = 1000;

/** Default maximum number of principal-specific rate-limit records retained by one application. */
export const DEFAULT_MCP_RATE_LIMIT_CAPACITY = 10_000;

/** MCP content block kinds emitted by the harness result helpers. */
export enum McpContentType {
  TEXT = 'text',
}

/** Closed set of feature kinds supported by the MCP harness. */
export enum McpFeatureKind {
  TOOL = 'tool',
  RESOURCE = 'resource',
  RESOURCE_TEMPLATE = 'resource-template',
  PROMPT = 'prompt',
}

/** JSON Schema reference strategies supported by manifest serialization. */
export enum McpJsonSchemaReferenceStrategy {
  INLINE = 'none',
}

/** Built-in transport names exposed in request metadata and diagnostics. */
export enum McpTransportName {
  STDIO = 'stdio',
  IN_MEMORY = 'in-memory',
}
