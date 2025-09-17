export interface AuthConfig {
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
export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType: string;
}
