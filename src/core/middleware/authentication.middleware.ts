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

import { ApiStatus } from '../../shared/types/apis.js';
import { JsonToTextResponse } from '../../shared/utils/responses.js';
import { IToolExecutionArgs, IToolExecutionContext, IToolMiddleware } from '../types.js';

/**
 * Authentication middleware for securing tool access
 * Implements security cross-cutting concern through middleware pattern
 */

export class AuthenticationMiddleware implements IToolMiddleware {
  name = 'authentication';
  priority = 10;

  async execute(
    params: IToolExecutionArgs,
    context: IToolExecutionContext,
    next: (params: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    // Basic authentication check
    if (!context.userId) {
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    // Additional authentication logic can be added here
    // For example, token validation, session checks, etc.
    return next(params, context);
  }
}
