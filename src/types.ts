import { CatalogApi } from '@backstage/catalog-client';
import {
  McpServer,
  RegisteredTool,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export enum ApiStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface IApiResponse {
  status: ApiStatus;
}

export interface IApiDataResponse<T> extends IApiResponse {
  data: T[];
}

export interface IToolRegistrationContext {
  server: McpServer;
  catalogClient: CatalogApi;
}

export type ToolRegistration = (
  context: IToolRegistrationContext
) => RegisteredTool;

export interface ToolMetadata {
  name: string;
  description: string;
  paramsSchema: z.ZodTypeAny;
}

export interface Tool {
  execute(args: unknown, context: object): Promise<CallToolResult>;
}

export interface ToolMetadataProvider {
  getMetadata(toolClass: unknown): ToolMetadata | undefined;
}

export interface ToolValidator {
  validate(metadata: ToolMetadata, file: string): void;
}

export interface ToolRegistrar {
  register(toolClass: ToolConstructor, metadata: ToolMetadata): void;
}

export interface ToolFactory {
  loadTool(filePath: string): Promise<ToolConstructor | undefined>;
}

export type ToolConstructor = {
  execute(args: unknown, context: object): Promise<CallToolResult>;
};

export type ToolClass = ToolConstructor | undefined;
