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
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../utils/core/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import axios, { AxiosResponse } from 'axios';

import { AuthConfig, TokenInfo } from '../types/auth.js';
import { AuthManager } from './auth-manager.js';

// Type for testing private properties
type AuthManagerWithPrivate = {
  tokenInfo?: TokenInfo;
  isTokenValid(): boolean;
  maxEvents?: number;
};

type TestAuthConfig = AuthConfig & { type: AuthConfig['type'] | 'unsupported' };

describe('AuthManager', () => {
  let authManager: AuthManager;
  let config: TestAuthConfig;

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      config = { type: 'bearer', token: 'test-token' };
      authManager = new AuthManager(config);
      expect(authManager).toBeDefined();
    });
  });

  describe('getAuthorizationHeader', () => {
    it('should return authorization header for bearer token', async () => {
      config = { type: 'bearer', token: 'test-token' };
      authManager = new AuthManager(config);

      const header = await authManager.getAuthorizationHeader();
      expect(header).toBe('Bearer test-token');
    });

    it('should throw error if bearer token not configured', async () => {
      config = { type: 'bearer' };
      authManager = new AuthManager(config);

      await expect(authManager.getAuthorizationHeader()).rejects.toThrow('Bearer token not configured');
    });

    it('should refresh token if expired', async () => {
      config = { type: 'bearer', token: 'test-token' };
      authManager = new AuthManager(config);

      // Simulate expired token
      (authManager as unknown as AuthManagerWithPrivate).tokenInfo = {
        accessToken: 'old',
        expiresAt: Date.now() - 1000,
        tokenType: 'Bearer',
      };

      const header = await authManager.getAuthorizationHeader();
      expect(header).toBe('Bearer test-token');
    });
  });

  describe('authenticate', () => {
    it('should ensure valid token', async () => {
      config = { type: 'bearer', token: 'test-token' };
      authManager = new AuthManager(config);

      await authManager.authenticate();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      config = { type: 'bearer', token: 'test-token' };
      authManager = new AuthManager(config);

      for (let i = 0; i < 100; i++) {
        await expect(authManager.checkRateLimit()).resolves.toBeUndefined();
      }
    });

    it('should throw error when rate limit exceeded', async () => {
      config = { type: 'bearer', token: 'test-token' };
      authManager = new AuthManager(config);

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await authManager.checkRateLimit();
      }

      // 101st should fail
      await expect(authManager.checkRateLimit()).rejects.toThrow('Rate limit exceeded');
    });

    it('should reset after window', async () => {
      config = { type: 'bearer', token: 'test-token' };
      authManager = new AuthManager(config);

      jest.useFakeTimers();

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await authManager.checkRateLimit();
      }

      // Advance time by 61 seconds
      jest.advanceTimersByTime(61000);

      // Should allow again
      await expect(authManager.checkRateLimit()).resolves.toBeUndefined();
    });
  });

  describe('token handling', () => {
    describe('bearer token', () => {
      it('should handle bearer token', async () => {
        config = { type: 'bearer', token: 'test-token' };
        authManager = new AuthManager(config);

        const header = await authManager.getAuthorizationHeader();
        expect(header).toBe('Bearer test-token');
      });

      it('should throw error if token not configured', async () => {
        config = { type: 'bearer' };
        authManager = new AuthManager(config);

        await expect(authManager.getAuthorizationHeader()).rejects.toThrow('Bearer token not configured');
      });
    });

    describe('api-key', () => {
      it('should handle api key', async () => {
        config = { type: 'api-key', apiKey: 'test-key' };
        authManager = new AuthManager(config);

        const header = await authManager.getAuthorizationHeader();
        expect(header).toBe('Bearer test-key');
      });

      it('should throw error if api key not configured', async () => {
        config = { type: 'api-key' };
        authManager = new AuthManager(config);

        await expect(authManager.getAuthorizationHeader()).rejects.toThrow('API key not configured');
      });
    });

    describe('service-account', () => {
      it('should handle service account', async () => {
        config = { type: 'service-account', serviceAccountKey: 'test-key' };
        authManager = new AuthManager(config);

        const header = await authManager.getAuthorizationHeader();
        expect(header).toBe('Bearer test-key');
      });

      it('should throw error if service account key not configured', async () => {
        config = { type: 'service-account' };
        authManager = new AuthManager(config);

        await expect(authManager.getAuthorizationHeader()).rejects.toThrow('Service account key not configured');
      });
    });

    describe('oauth', () => {
      beforeEach(() => {
        config = {
          type: 'oauth',
          clientId: 'client-id',
          clientSecret: 'client-secret',
          tokenUrl: 'https://example.com/token',
        };
        authManager = new AuthManager(config);
        (authManager as unknown as AuthManagerWithPrivate).tokenInfo = {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
        };
      });

      it('should refresh oauth token', async () => {
        config = {
          type: 'oauth',
          clientId: 'client-id',
          clientSecret: 'client-secret',
          tokenUrl: 'https://example.com/token',
        };
        authManager = new AuthManager(config);
        // Set up expired token to trigger refresh
        (authManager as unknown as AuthManagerWithPrivate).tokenInfo = {
          accessToken: 'old-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
          expiresAt: Date.now() - 1000, // Expired 1 second ago
        };

        const mockResponse: Partial<AxiosResponse> = {
          data: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
            token_type: 'Bearer',
          },
          status: 200,
          statusText: 'OK',
        };
        jest.spyOn(axios, 'post').mockResolvedValueOnce(mockResponse);

        const header = await authManager.getAuthorizationHeader();
        expect(header).toBe('Bearer new-access-token');
        expect(axios.post).toHaveBeenCalledWith('https://example.com/token', {
          grant_type: 'refresh_token',
          client_id: 'client-id',
          client_secret: 'client-secret',
          refresh_token: 'refresh-token',
        });
      });

      it('should throw error if oauth config incomplete', async () => {
        config = { type: 'oauth' };
        authManager = new AuthManager(config);

        await expect(authManager.getAuthorizationHeader()).rejects.toThrow('OAuth configuration incomplete');
      });

      it('should throw error if no refresh token', async () => {
        config = {
          type: 'oauth',
          clientId: 'client-id',
          clientSecret: 'client-secret',
          tokenUrl: 'https://example.com/token',
        };
        authManager = new AuthManager(config);

        await expect(authManager.getAuthorizationHeader()).rejects.toThrow('No refresh token available for OAuth');
      });

      it('should parse oauth response correctly', async () => {
        // Set up expired token to trigger refresh
        (authManager as unknown as AuthManagerWithPrivate).tokenInfo = {
          accessToken: 'old-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
          expiresAt: Date.now() - 1000, // Expired 1 second ago
        };

        const mockResponse = {
          data: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            token_type: 'Bearer',
          },
          status: 200,
          statusText: 'OK',
        };
        jest.spyOn(axios, 'post').mockResolvedValueOnce(mockResponse);

        await authManager.getAuthorizationHeader();

        const tokenInfo = (authManager as unknown as AuthManagerWithPrivate).tokenInfo!;
        expect(tokenInfo.accessToken).toBe('access-token');
        expect(tokenInfo.refreshToken).toBe('refresh-token');
        expect(tokenInfo.tokenType).toBe('Bearer');
        expect(tokenInfo.expiresAt).toBeGreaterThan(Date.now());
      });

      it('should handle missing expires_in', async () => {
        const mockResponse = {
          data: {
            access_token: 'access-token',
            token_type: 'Bearer',
          },
          status: 200,
          statusText: 'OK',
        };
        jest.spyOn(axios, 'post').mockResolvedValueOnce(mockResponse);

        await authManager.getAuthorizationHeader();

        const tokenInfo = (authManager as unknown as AuthManagerWithPrivate).tokenInfo!;
        expect(tokenInfo.expiresAt).toBeUndefined();
      });

      it('should handle invalid expires_in', async () => {
        const mockResponse = {
          data: {
            access_token: 'access-token',
            expires_in: 'invalid',
            token_type: 'Bearer',
          },
          status: 200,
          statusText: 'OK',
        };
        jest.spyOn(axios, 'post').mockResolvedValueOnce(mockResponse);

        await authManager.getAuthorizationHeader();

        const tokenInfo = (authManager as unknown as AuthManagerWithPrivate).tokenInfo!;
        expect(tokenInfo.expiresAt).toBeUndefined();
      });

      it('should default token_type to Bearer', async () => {
        const mockResponse = {
          data: {
            access_token: 'access-token',
          },
          status: 200,
          statusText: 'OK',
        };
        jest.spyOn(axios, 'post').mockResolvedValueOnce(mockResponse);

        await authManager.getAuthorizationHeader();

        const tokenInfo = (authManager as unknown as AuthManagerWithPrivate).tokenInfo!;
        expect(tokenInfo.tokenType).toBe('Bearer');
      });
    });

    describe('unsupported type', () => {
      it('should throw error for unsupported auth type', async () => {
        config = { type: 'unsupported' as TestAuthConfig['type'] };
        authManager = new AuthManager(config);

        await expect(authManager.getAuthorizationHeader()).rejects.toThrow(
          'Unsupported authentication type: unsupported'
        );
      });
    });

    describe('token validity', () => {
      it('should consider token valid if no expiry', () => {
        config = { type: 'bearer', token: 'test' };
        authManager = new AuthManager(config);
        (authManager as unknown as AuthManagerWithPrivate).tokenInfo = { accessToken: 'token', tokenType: 'Bearer' };

        const isValid = (authManager as unknown as AuthManagerWithPrivate).isTokenValid();
        expect(isValid).toBe(true);
      });

      it('should consider token invalid if expired', () => {
        config = { type: 'bearer', token: 'test' };
        authManager = new AuthManager(config);
        (authManager as unknown as AuthManagerWithPrivate).tokenInfo = {
          accessToken: 'token',
          expiresAt: Date.now() - 10000,
          tokenType: 'Bearer',
        };

        const isValid = (authManager as unknown as AuthManagerWithPrivate).isTokenValid();
        expect(isValid).toBe(false);
      });

      it('should consider token valid if not expired', () => {
        config = { type: 'bearer', token: 'test' };
        authManager = new AuthManager(config);
        (authManager as unknown as AuthManagerWithPrivate).tokenInfo = {
          accessToken: 'token',
          expiresAt: Date.now() + 400000, // 6.67 minutes from now - should be valid
          tokenType: 'Bearer',
        };

        const isValid = (authManager as unknown as AuthManagerWithPrivate).isTokenValid();
        expect(isValid).toBe(true);
      });

      it('should refresh 5 minutes before expiry', () => {
        config = { type: 'bearer', token: 'test' };
        authManager = new AuthManager(config);
        const expiresAt = Date.now() + 10000; // 10 seconds from now - should refresh
        (authManager as unknown as AuthManagerWithPrivate).tokenInfo = {
          accessToken: 'token',
          expiresAt,
          tokenType: 'Bearer',
        };

        const isValid = (authManager as unknown as AuthManagerWithPrivate).isTokenValid();
        expect(isValid).toBe(false);
      });
    });

    describe('concurrent refresh', () => {
      it('should handle concurrent token refresh', async () => {
        // Reset all mocks to ensure clean state
        jest.resetAllMocks();

        config = {
          type: 'oauth',
          clientId: 'client-id',
          clientSecret: 'client-secret',
          tokenUrl: 'https://example.com/token',
        };
        authManager = new AuthManager(config);
        // Set up expired token to trigger refresh
        (authManager as unknown as AuthManagerWithPrivate).tokenInfo = {
          accessToken: 'old-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
          expiresAt: Date.now() - 1000, // Expired
        };

        const mockResponse = {
          data: {
            access_token: 'new-access-token',
            token_type: 'Bearer',
          },
          status: 200,
          statusText: 'OK',
        };
        const axiosPostSpy = jest.spyOn(axios, 'post').mockResolvedValue(mockResponse);

        // Ensure only one refresh happens
        const promises = [
          authManager.getAuthorizationHeader(),
          authManager.getAuthorizationHeader(),
          authManager.getAuthorizationHeader(),
        ];
        const results = await Promise.all(promises);
        expect(results).toEqual(['Bearer new-access-token', 'Bearer new-access-token', 'Bearer new-access-token']);
        expect(axiosPostSpy).toHaveBeenCalledTimes(1); // Only one actual refresh
      });
    });
  });
});
