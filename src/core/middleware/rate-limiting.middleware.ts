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
 * Rate limiting middleware for preventing abuse
 * Implements rate limiting cross-cutting concern
 */

export class RateLimitingMiddleware implements IToolMiddleware {
  name = 'rateLimit';
  priority = 8;

  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async execute(
    params: IToolExecutionArgs,
    context: IToolExecutionContext,
    next: (params: IToolExecutionArgs, context: IToolExecutionContext) => Promise<CallToolResult>
  ): Promise<CallToolResult> {
    const userId = context.userId || 'anonymous';
    const now = Date.now();

    // Clean expired entries
    this.cleanExpiredEntries(now);

    // Get or create user rate limit entry
    let userLimit = this.requests.get(userId);
    if (!userLimit || now > userLimit.resetTime) {
      userLimit = { count: 0, resetTime: now + this.windowMs };
      this.requests.set(userId, userLimit);
    }

    // Check rate limit
    if (userLimit.count >= this.maxRequests) {
      return JsonToTextResponse({
        status: ApiStatus.ERROR,
        data: {
          message: `Rate limit exceeded. Try again in ${Math.ceil((userLimit.resetTime - now) / 1000)} seconds`,
          code: 'RATE_LIMIT_EXCEEDED',
        },
      });
    }

    // Increment request count
    userLimit.count++;

    return next(params, context);
  }

  private cleanExpiredEntries(now: number): void {
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}
