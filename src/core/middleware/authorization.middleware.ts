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
 * Authorization middleware for scope-based access control
 * Implements authorization cross-cutting concern
 */

export class AuthorizationMiddleware implements IToolMiddleware {
  name = 'authorization';
  priority = 15;

  constructor(private requiredScopes: string[] = []) {}

  async execute(
    params: IToolExecutionArgs,
    context: IToolExecutionContext,
    next: (params: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    if (this.requiredScopes.length === 0) {
      return next(params, context);
    }

    const userScopes = context.scopes || [];
    const hasRequiredScopes = this.requiredScopes.every((scope) => userScopes.includes(scope));

    if (!hasRequiredScopes) {
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Insufficient permissions. Required scopes: ${this.requiredScopes.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS',
        },
      });
    }

    return next(params, context);
  }
}
