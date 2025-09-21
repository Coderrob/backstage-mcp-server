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

import { ITool, IToolExecutionArgs, IToolExecutionContext } from '../../core/types.js';
import { ApiStatus } from '../../shared/types/apis.js';
import { JsonToTextResponse } from '../../shared/utils/responses.js';

/**
 * Base class for catalog tools that provides common functionality
 * and eliminates code duplication across catalog tool implementations.
 */
export abstract class BaseCatalogTool implements ITool {
  /**
   * Gets the Zod schema for validating tool parameters
   */
  protected abstract getSchema(): z.ZodSchema;

  /**
   * Executes the catalog operation with parsed parameters
   * @param parsedParams - The validated parameters
   * @param context - The tool execution context
   * @returns The result of the catalog operation
   */
  protected abstract executeCatalogOperation(parsedParams: unknown, context: IToolExecutionContext): Promise<unknown>;

  /**
   * Gets the error message for operation failures
   */
  protected abstract getErrorMessage(): string;

  /**
   * Gets the error code for operation failures
   */
  protected abstract getErrorCode(): string;

  /**
   * Executes the tool with common error handling and response formatting
   */
  async execute(params: IToolExecutionArgs, context: IToolExecutionContext): Promise<CallToolResult> {
    try {
      const parsedParams = this.getSchema().parse(params);
      const result = await this.executeCatalogOperation(parsedParams, context);

      return JsonToTextResponse({
        status: ApiStatus.SUCCESS,
        data: result,
      });
    } catch (error) {
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: error instanceof Error ? error.message : this.getErrorMessage(),
          code: this.getErrorCode(),
        },
      });
    }
  }
}
