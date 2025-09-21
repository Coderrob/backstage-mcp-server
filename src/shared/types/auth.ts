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

/**
 * Configuration for different authentication methods.
 */
export interface IAuthConfig {
  type: 'bearer' | 'oauth' | 'api-key' | 'service-account';
  token?: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  apiKey?: string;
  serviceAccountKey?: string;
}

/**
 * Information about an authentication token.
 */
export interface ITokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType: string;
}
