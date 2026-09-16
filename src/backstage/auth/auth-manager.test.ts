/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { AuthenticationError } from '../../shared/errors/error-handling.js';
import { AuthManager } from './auth-manager.js';

describe('AuthManager', () => {
  it('should create a bearer authorization header', () => {
    expect(new AuthManager({ type: 'bearer', token: 'catalog-token' }).getAuthorizationHeader()).toBe(
      'Bearer catalog-token'
    );
  });

  it('should reject empty bearer credentials', () => {
    expect(() => new AuthManager({ type: 'bearer', token: '' })).toThrow(AuthenticationError);
  });
});
