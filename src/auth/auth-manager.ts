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
import axios, { AxiosResponse } from 'axios';

import { AuthConfig, TokenInfo } from '../types/auth.js';
import { isNonEmptyString, isNullOrUndefined, isNumber } from '../utils/core/guards.js';
import { logger } from '../utils/core/logger.js';
import { AuthenticationError, ConfigurationError } from '../utils/errors/custom-errors.js';
import { RateLimiter } from './rate-limiter.js';

/**
 * Manages authentication tokens and handles token refresh logic.
 * Supports multiple authentication methods and automatic token renewal.
 */
export class AuthManager {
  private config: AuthConfig;
  private tokenInfo?: TokenInfo;
  private refreshPromise?: Promise<TokenInfo>;
  private rateLimiter: RateLimiter;

  constructor(config: AuthConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Gets the authorization header value for authenticated requests.
   * Ensures a valid token is available before returning the header.
   * @returns Promise resolving to authorization header string
   * @throws AuthenticationError if no valid token is available
   */
  async getAuthorizationHeader(): Promise<string> {
    logger.debug('Retrieving authorization header');
    await this.ensureValidToken();
    if (!this.tokenInfo) {
      logger.error('No valid authentication token available');
      throw new AuthenticationError('No valid authentication token available');
    }
    logger.debug('Authorization header retrieved successfully');
    return `${this.tokenInfo.tokenType} ${this.tokenInfo.accessToken}`;
  }

  /**
   * Ensures a valid authentication token is available.
   * Refreshes the token if the current one is expired or missing.
   * @returns Promise that resolves when a valid token is available
   * @private
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.isTokenValid()) {
      await this.refreshToken();
    }
  }

  /**
   * Checks if the current token is still valid.
   * Considers token expiry with a 5-minute refresh buffer.
   * @returns True if token is valid, false otherwise
   * @private
   */
  private isTokenValid(): boolean {
    if (isNullOrUndefined(this.tokenInfo)) return false;
    if (isNullOrUndefined(this.tokenInfo.expiresAt)) return true;

    // Refresh 5 minutes before expiry
    const refreshThreshold = Date.now() + 5 * 60 * 1000;
    return (this.tokenInfo.expiresAt as number) > refreshThreshold;
  }

  /**
   * Refreshes the authentication token.
   * Obtains a new token using the appropriate method based on configuration.
   * @returns Promise that resolves when the token is refreshed
   * @private
   */
  private async refreshToken(): Promise<void> {
    logger.debug('Starting token refresh');
    if (this.refreshPromise) {
      logger.debug('Token refresh already in progress, waiting');
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.performTokenRefresh();
    try {
      this.tokenInfo = await this.refreshPromise;
      logger.info('Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  /**
   * Performs the actual token refresh operation.
   * Delegates to the appropriate handler based on the authentication method.
   * @returns Promise resolving to the new TokenInfo
   * @private
   */
  private async performTokenRefresh(): Promise<TokenInfo> {
    switch (this.config.type) {
      case 'bearer':
        return this.handleBearerToken();
      case 'oauth':
        return this.handleOAuthRefresh();
      case 'api-key':
        return this.handleApiKey();
      case 'service-account':
        return this.handleServiceAccount();
      default:
        throw new ConfigurationError(`Unsupported authentication type: ${this.config.type}`);
    }
  }

  /**
   * Handles token refresh for Bearer token authentication.
   * @returns Promise resolving to new TokenInfo with updated access token
   * @private
   */
  private async handleBearerToken(): Promise<TokenInfo> {
    if (!isNonEmptyString(this.config.token)) {
      throw new ConfigurationError('Bearer token not configured');
    }
    return {
      accessToken: this.config.token,
      tokenType: 'Bearer',
    };
  }

  /**
   * Handles token refresh for OAuth2 authentication.
   * Uses the refresh token to obtain a new access token.
   * @returns Promise resolving to new TokenInfo with updated access and refresh tokens
   * @private
   */
  private async handleOAuthRefresh(): Promise<TokenInfo> {
    this.validateOAuthConfig();
    this.validateRefreshToken();

    const response = await axios.post(this.config.tokenUrl!, {
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.tokenInfo?.refreshToken,
    });

    return this.parseOAuthResponse(response);
  }

  /**
   * Validates that OAuth configuration is complete.
   * @throws ConfigurationError if OAuth configuration is incomplete
   * @private
   */
  private validateOAuthConfig(): void {
    if (
      !isNonEmptyString(this.config.clientId) ||
      !isNonEmptyString(this.config.clientSecret) ||
      !isNonEmptyString(this.config.tokenUrl)
    ) {
      throw new ConfigurationError('OAuth configuration incomplete');
    }
  }

  /**
   * Validates that a refresh token is available.
   * @throws ConfigurationError if no refresh token is available
   * @private
   */
  private validateRefreshToken(): void {
    if (!isNonEmptyString(this.tokenInfo?.refreshToken)) {
      throw new ConfigurationError('No refresh token available for OAuth');
    }
  }

  /**
   * Handles token provision for API Key authentication.
   * @returns Promise resolving to new TokenInfo with API key as access token
   * @private
   */
  private async handleApiKey(): Promise<TokenInfo> {
    if (!isNonEmptyString(this.config.apiKey)) {
      throw new ConfigurationError('API key not configured');
    }
    return {
      accessToken: this.config.apiKey,
      tokenType: 'Bearer', // API keys typically use Bearer
    };
  }

  /**
   * Handles token provision for Service Account authentication.
   * @returns Promise resolving to new TokenInfo with service account key as access token
   * @private
   */
  private async handleServiceAccount(): Promise<TokenInfo> {
    if (!isNonEmptyString(this.config.serviceAccountKey)) {
      throw new ConfigurationError('Service account key not configured');
    }

    // For service accounts, we might need to implement JWT signing
    // This is a simplified implementation
    return {
      accessToken: this.config.serviceAccountKey,
      tokenType: 'Bearer',
    };
  }

  /**
   * Parses the OAuth2 token response from the server.
   * Extracts and returns TokenInfo including access token, refresh token, and expiry.
   * @param response - The Axios response object containing the token response
   * @returns Parsed TokenInfo object
   * @private
   */
  private parseOAuthResponse(response: AxiosResponse): TokenInfo {
    const data = response.data as {
      expires_in?: number;
      access_token: string;
      refresh_token?: string;
      token_type?: string;
    };
    const expiresAt =
      isNumber(data.expires_in) && !Number.isNaN(data.expires_in) ? Date.now() + data.expires_in * 1000 : undefined;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      tokenType: isNonEmptyString(data.token_type) ? data.token_type : 'Bearer',
    };
  }

  /**
   * Authenticates the client by ensuring a valid token is available.
   * @returns Promise that resolves when authentication is successful
   */
  async authenticate(): Promise<void> {
    await this.ensureValidToken();
  }

  /**
   * Checks and enforces rate limits for requests.
   * Throws a RateLimitError if the rate limit is exceeded.
   * @returns Promise that resolves when the rate limit check is passed
   * @throws RateLimitError if the rate limit is exceeded
   */
  async checkRateLimit(): Promise<void> {
    return this.rateLimiter.checkLimit();
  }
}
