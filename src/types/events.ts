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
export enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  TOKEN_REFRESH = 'token_refresh',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_REQUEST = 'invalid_request',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
}

export interface ISecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource: string;
  action: string;
  success: boolean;
  details?: Record<string, unknown>;
  errorMessage?: string;
}

export interface ISecurityEventFilter {
  type?: SecurityEventType;
  userId?: string;
  since?: Date;
  limit?: number;
}

export interface ISecurityEventSummary {
  totalEvents: number;
  authSuccessCount: number;
  authFailureCount: number;
  rateLimitCount: number;
  recentEvents: ISecurityEvent[];
}
