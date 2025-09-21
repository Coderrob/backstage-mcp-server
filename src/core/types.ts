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
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { IBackstageCatalogApi } from '../shared/types/plugins.js';

/**
 * Core tool execution context providing dependencies and services
 */
export interface IToolExecutionContext {
  catalogClient: IBackstageCatalogApi;
  cache?: Map<string, unknown>;
  userId?: string;
  scopes?: string[];
  [key: string]: unknown;
}

/**
 * Arguments passed to tool execution
 */
export interface IToolExecutionArgs {
  [key: string]: unknown;
}

/**
 * Core tool interface following Single Responsibility Principle
 */
export interface ITool {
  execute(params: IToolExecutionArgs, context: IToolExecutionContext): Promise<CallToolResult>;
}

/**
 * Enhanced tool interface with metadata support
 */
export interface IEnhancedTool extends ITool {
  getMetadata(): IToolMetadata;
}

/**
 * Tool metadata interface for registration and discovery
 */
export interface IToolMetadata {
  name: string;
  description: string;
  paramsSchema?: z.ZodTypeAny;
  category?: string;
  tags?: string[];
  version?: string;
  deprecated?: boolean;
  cacheable?: boolean;
  requiresConfirmation?: boolean;
  requiredScopes?: string[];
  maxBatchSize?: number;
}

/**
 * Tool execution strategy interface following Strategy Pattern
 */
export interface IToolExecutionStrategy {
  execute(
    tool: ITool,
    params: IToolExecutionArgs,
    context: IToolExecutionContext,
    metadata: IToolMetadata
  ): Promise<CallToolResult>;
}

/**
 * Middleware interface for cross-cutting concerns
 */
export interface IToolMiddleware {
  name: string;
  priority: number;
  execute(
    params: IToolExecutionArgs,
    context: IToolExecutionContext,
    next: (params: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult>;
}

/**
 * Plugin interface for modular tool organization
 */
export interface IToolPlugin {
  name: string;
  version: string;
  description: string;

  initialize(registrar: IToolRegistrar): Promise<void>;
  destroy(): Promise<void>;
}

/**
 * Tool registrar for plugin-based registration
 */
export interface IToolRegistrar {
  registerTool(tool: IEnhancedTool, metadata: IToolMetadata): void;
  getRegisteredTools(): Array<{ tool: IEnhancedTool; metadata: IToolMetadata }>;
}

/**
 * Tool registration context for server integration
 */
export interface IToolRegistrationContext {
  catalogClient: IBackstageCatalogApi;
  [key: string]: unknown;
}
