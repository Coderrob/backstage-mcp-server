/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

/** Lifecycle states exposed by an MCP application instance. */
export enum McpApplicationState {
  CREATED = 'created',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
}

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

/** Built-in transport names exposed in request metadata and diagnostics. */
export enum McpTransportName {
  STDIO = 'stdio',
  IN_MEMORY = 'in-memory',
}
