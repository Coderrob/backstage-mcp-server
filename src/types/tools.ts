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
import { McpServer, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { IBackstageCatalogApi } from './apis.js';

/**
 * RawToolMetadata represents metadata as it appears in a file/manifest
 * (paramsSchema is a plain object shape when authored in JSON/JS).
 */
export const rawToolMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  paramsSchema: z.record(z.string(), z.any()).optional(),
});

export type RawToolMetadata = z.infer<typeof rawToolMetadataSchema>;

/**
 * IToolMetadata is the runtime form used by the registrar/factory: paramsSchema
 * is a Zod schema (z.ZodTypeAny).
 */
export interface IToolMetadata {
  name: string;
  description: string;
  paramsSchema?: z.ZodTypeAny;
}

export interface IToolRegistrationContext {
  server: McpServer;
  catalogClient: IBackstageCatalogApi;
}

export type ToolRegistration = (context: IToolRegistrationContext) => RegisteredTool;

export interface ITool {
  execute(args: IToolExecutionArgs, context: IToolExecutionContext): Promise<CallToolResult>;
}

// ToolClass represents a tool class with a static execute method
export type ToolClass = {
  new (): unknown;
  execute(args: IToolExecutionArgs, context: IToolExecutionContext): Promise<CallToolResult>;
};

/**
 * Arguments passed to tool execution
 */
export interface IToolExecutionArgs {
  [key: string]: unknown;
}

/**
 * Context provided during tool execution
 */
export interface IToolExecutionContext {
  server: McpServer;
  catalogClient: IBackstageCatalogApi;
  [key: string]: unknown;
}

/**
 * Factory for creating tool instances
 */
export interface IToolFactory {
  loadTool(filePath: string): Promise<ITool | undefined>;
}

/**
 * Registrar for registering tools with the MCP server
 */
export interface IToolRegistrar {
  register(toolClass: ITool, metadata: IToolMetadata): void;
}

/**
 * Validator for tool metadata
 */
export interface IToolValidator {
  validate(metadata: IToolMetadata, file: string): void;
}

/**
 * Provider for tool metadata
 */
export interface IToolMetadataProvider {
  getMetadata(toolClass: ToolClass | object): IToolMetadata | undefined;
}
