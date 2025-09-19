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
import { z } from 'zod';

import {
  ApiStatus,
  type CallToolResult,
  IToolRegistrationContext,
  JsonToTextResponse,
  ToolErrorHandler,
  ToolName,
} from './common-imports.js';

/**
 * Base template for catalog tools with common patterns
 */
export abstract class BaseCatalogTool<TParams extends z.ZodTypeAny> {
  protected readonly toolName: ToolName;
  protected readonly description: string;
  protected readonly paramsSchema: TParams;

  constructor(toolName: ToolName, description: string, paramsSchema: TParams) {
    this.toolName = toolName;
    this.description = description;
    this.paramsSchema = paramsSchema;
  }

  /**
   * Execute the tool with error handling
   */
  protected async executeWithErrorHandling(
    request: z.infer<TParams>,
    context: IToolRegistrationContext,
    operation: (args: z.infer<TParams>, ctx: IToolRegistrationContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      this.toolName,
      this.toolName.toLowerCase().replace(/_/g, ''),
      operation,
      request,
      context
    );
  }

  /**
   * Create a standardized success response
   */
  protected createSuccessResponse(data: unknown): CallToolResult {
    return JsonToTextResponse({ status: ApiStatus.SUCCESS, data });
  }

  /**
   * Abstract method that must be implemented by subclasses
   */
  abstract execute(request: z.infer<TParams>, context: IToolRegistrationContext): Promise<CallToolResult>;
}
