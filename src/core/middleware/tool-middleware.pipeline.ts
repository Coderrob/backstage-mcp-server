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

import { IToolExecutionArgs, IToolExecutionContext, IToolMiddleware } from '../types.js';

/**
 * Middleware pipeline for composing multiple middleware
 * Implements Chain of Responsibility pattern
 */

export class ToolMiddlewarePipeline {
  private middlewares: IToolMiddleware[] = [];

  /**
   * Add middleware to the pipeline
   */
  use(middleware: IToolMiddleware): this {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => a.priority - b.priority);
    return this;
  }

  /**
   * Execute the middleware pipeline
   */
  async execute(
    params: IToolExecutionArgs,
    context: IToolExecutionContext,
    finalHandler: (params: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    let index = 0;

    const next = async (
      nextParams: IToolExecutionArgs,
      nextContext: IToolExecutionContext
    ): Promise<CallToolResult> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        return middleware.execute(nextParams, nextContext, next);
      }
      return finalHandler(nextParams, nextContext);
    };

    return next(params, context);
  }

  /**
   * Get the current middleware stack
   */
  getMiddleware(): IToolMiddleware[] {
    return [...this.middlewares];
  }

  /**
   * Clear all middleware
   */
  clear(): void {
    this.middlewares = [];
  }
}
