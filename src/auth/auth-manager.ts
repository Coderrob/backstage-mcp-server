import axios, { AxiosResponse } from 'axios';

import { logger } from '../utils';

export interface AuthConfig {
  type: 'bearer' | 'oauth' | 'api-key' | 'service-account';
  token?: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  apiKey?: string;
  serviceAccountKey?: string;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType: string;
}

export class AuthManager {
  private config: AuthConfig;
  private tokenInfo?: TokenInfo;
  private refreshPromise?: Promise<TokenInfo>;
  private rateLimiter: RateLimiter;

  constructor(config: AuthConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter();
  }

  async getAuthorizationHeader(): Promise<string> {
    logger.debug('Retrieving authorization header');
    await this.ensureValidToken();
    if (!this.tokenInfo) {
      logger.error('No valid authentication token available');
      throw new Error('No valid authentication token available');
    }
    logger.debug('Authorization header retrieved successfully');
    return `${this.tokenInfo.tokenType} ${this.tokenInfo.accessToken}`;
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.isTokenValid()) {
      await this.refreshToken();
    }
  }

  private isTokenValid(): boolean {
    if (this.tokenInfo === undefined || this.tokenInfo === null) return false;
    if (this.tokenInfo.expiresAt === undefined || this.tokenInfo.expiresAt === null) return true; // Assume valid if no expiry

    // Refresh 5 minutes before expiry
    const refreshThreshold = Date.now() + 5 * 60 * 1000;
    return (this.tokenInfo.expiresAt as number) > refreshThreshold;
  }

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
        throw new Error(`Unsupported authentication type: ${this.config.type}`);
    }
  }

  private async handleBearerToken(): Promise<TokenInfo> {
    if (typeof this.config.token !== 'string' || this.config.token.length === 0) {
      throw new Error('Bearer token not configured');
    }
    return {
      accessToken: this.config.token,
      tokenType: 'Bearer',
    };
  }

  private async handleOAuthRefresh(): Promise<TokenInfo> {
    if (
      typeof this.config.clientId !== 'string' ||
      this.config.clientId.length === 0 ||
      typeof this.config.clientSecret !== 'string' ||
      this.config.clientSecret.length === 0 ||
      typeof this.config.tokenUrl !== 'string' ||
      this.config.tokenUrl.length === 0
    ) {
      throw new Error('OAuth configuration incomplete');
    }

    if (
      !this.tokenInfo ||
      typeof this.tokenInfo.refreshToken !== 'string' ||
      this.tokenInfo.refreshToken.length === 0
    ) {
      throw new Error('No refresh token available for OAuth');
    }

    const response = await axios.post(this.config.tokenUrl, {
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.tokenInfo.refreshToken,
    });

    return this.parseOAuthResponse(response);
  }

  private async handleApiKey(): Promise<TokenInfo> {
    if (typeof this.config.apiKey !== 'string' || this.config.apiKey.length === 0) {
      throw new Error('API key not configured');
    }
    return {
      accessToken: this.config.apiKey,
      tokenType: 'Bearer', // API keys typically use Bearer
    };
  }

  private async handleServiceAccount(): Promise<TokenInfo> {
    if (typeof this.config.serviceAccountKey !== 'string' || this.config.serviceAccountKey.length === 0) {
      throw new Error('Service account key not configured');
    }

    // For service accounts, we might need to implement JWT signing
    // This is a simplified implementation
    return {
      accessToken: this.config.serviceAccountKey,
      tokenType: 'Bearer',
    };
  }

  private parseOAuthResponse(response: AxiosResponse): TokenInfo {
    const data = response.data as {
      expires_in?: number;
      access_token: string;
      refresh_token?: string;
      token_type?: string;
    };
    const expiresAt =
      typeof data.expires_in === 'number' && !Number.isNaN(data.expires_in)
        ? Date.now() + data.expires_in * 1000
        : undefined;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      tokenType: typeof data.token_type === 'string' && data.token_type.length > 0 ? data.token_type : 'Bearer',
    };
  }

  async authenticate(): Promise<void> {
    await this.ensureValidToken();
  }

  // Rate limiting functionality
  async checkRateLimit(): Promise<void> {
    return this.rateLimiter.checkLimit();
  }
}

class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 100; // requests per window
  private readonly windowMs = 60 * 1000; // 1 minute window

  async checkLimit(): Promise<void> {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`);
    }

    this.requests.push(now);
  }
}
