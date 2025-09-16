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
  paramsSchema: z.record(z.any()).optional(),
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
