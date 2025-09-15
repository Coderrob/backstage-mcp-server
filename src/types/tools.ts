import { McpServer, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { IBackstageCatalogApi } from './apis';

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

// IToolMetadata is exported from src/types/tool-metadata.ts

export interface ITool {
  execute(args: IToolExecutionArgs, context: IToolExecutionContext): Promise<CallToolResult>;
}

export interface IToolMetadataProvider {
  getMetadata(toolClass: ToolClass): IToolMetadata | undefined;
}

export interface IToolValidator {
  validate(metadata: IToolMetadata, file: string): void;
}

export interface IToolRegistrar {
  register(toolClass: ToolClass, metadata: IToolMetadata): void;
}

export interface IToolFactory {
  loadTool(filePath: string): Promise<ITool | undefined>;
}

export type ToolClass = ITool;

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
  catalogClient: IBackstageCatalogApi;
  [key: string]: unknown;
}
