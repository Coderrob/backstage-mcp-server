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
import { jest } from '@jest/globals';

import { buildAuthConfig } from './server.js';

describe('server', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Restore original env
    delete process.env.BACKSTAGE_TOKEN;
    delete process.env.BACKSTAGE_CLIENT_ID;
    delete process.env.BACKSTAGE_CLIENT_SECRET;
    delete process.env.BACKSTAGE_TOKEN_URL;
    delete process.env.BACKSTAGE_API_KEY;
    delete process.env.BACKSTAGE_SERVICE_ACCOUNT_KEY;
  });

  describe('buildAuthConfig', () => {
    it('should build bearer auth config', () => {
      process.env.BACKSTAGE_TOKEN = 'test-token';

      const result = buildAuthConfig();

      expect(result).toEqual({
        type: 'bearer',
        token: 'test-token',
      });
    });

    it('should build oauth auth config', () => {
      process.env.BACKSTAGE_CLIENT_ID = 'client-id';
      process.env.BACKSTAGE_CLIENT_SECRET = 'client-secret';
      process.env.BACKSTAGE_TOKEN_URL = 'https://token.url';

      const result = buildAuthConfig();

      expect(result).toEqual({
        type: 'oauth',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        tokenUrl: 'https://token.url',
      });
    });

    it('should build api-key auth config', () => {
      process.env.BACKSTAGE_API_KEY = 'api-key';

      const result = buildAuthConfig();

      expect(result).toEqual({
        type: 'api-key',
        apiKey: 'api-key',
      });
    });

    it('should build service-account auth config', () => {
      process.env.BACKSTAGE_SERVICE_ACCOUNT_KEY = 'service-key';

      const result = buildAuthConfig();

      expect(result).toEqual({
        type: 'service-account',
        serviceAccountKey: 'service-key',
      });
    });

    it('should prioritize bearer over others', () => {
      process.env.BACKSTAGE_TOKEN = 'token';
      process.env.BACKSTAGE_API_KEY = 'key';

      const result = buildAuthConfig();

      expect(result.type).toBe('bearer');
    });

    it('should throw error when no auth config', () => {
      expect(() => buildAuthConfig()).toThrow('No valid authentication configuration found');
    });

    it('should throw error for incomplete oauth', () => {
      process.env.BACKSTAGE_CLIENT_ID = 'id';
      process.env.BACKSTAGE_CLIENT_SECRET = 'secret';
      // Missing tokenUrl

      expect(() => buildAuthConfig()).toThrow('No valid authentication configuration found');
    });
  });
});
