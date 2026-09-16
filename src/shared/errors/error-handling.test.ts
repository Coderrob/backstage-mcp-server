/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { describe, expect, it } from 'vitest';

import { ApplicationErrorCode, AuthenticationError, ConfigurationError } from './error-handling.js';

describe('application errors', () => {
  it('should expose stable authentication error metadata', () => {
    const error = new AuthenticationError(undefined, { provider: 'static' });
    expect(error).toMatchObject({
      name: 'AuthenticationError',
      message: 'Authentication required',
      code: ApplicationErrorCode.AUTHENTICATION,
      details: { provider: 'static' },
    });
  });

  it('should expose stable configuration error metadata', () => {
    const error = new ConfigurationError('Missing URL', { variable: 'BACKSTAGE_BASE_URL' });
    expect(error).toMatchObject({
      name: 'ConfigurationError',
      message: 'Missing URL',
      code: ApplicationErrorCode.CONFIGURATION,
      details: { variable: 'BACKSTAGE_BASE_URL' },
    });
  });
});
