/* eslint-disable import/no-unused-modules */
import type { McpServer, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { BackstageCatalogApi } from './api/backstage-catalog-api';
export type { IToolMetadata, RawToolMetadata } from './types/tool-metadata';
import type { IToolMetadata } from './types/tool-metadata';

export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  fatal(message: string, ...args: unknown[]): void;
}

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
  catalogClient: BackstageCatalogApi;
}

export type ToolRegistration = (context: IToolRegistrationContext) => RegisteredTool;

// IToolMetadata is exported from src/types/tool-metadata.ts

export interface ITool {
  execute(args: unknown, context: object): Promise<CallToolResult>;
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
  loadTool(filePath: string): Promise<IToolConstructor | undefined>;
}

export interface IToolConstructor {
  execute(args: unknown, context: object): Promise<CallToolResult>;
}

export type ToolClass = unknown;
