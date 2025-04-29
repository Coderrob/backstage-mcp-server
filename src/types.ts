import { CatalogApi } from '@backstage/catalog-client';
import {
  McpServer,
  RegisteredTool,
} from '@modelcontextprotocol/sdk/server/mcp.js';
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
