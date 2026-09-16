/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { AuthenticationError } from '../../shared/errors/error-handling.js';
import { AuthManager } from './auth-manager.js';

describe('AuthManager', () => {
  let temporaryDirectory: string | undefined;

  afterEach(async () => {
    if (temporaryDirectory !== undefined) await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('should create a bearer authorization header', async () => {
    await expect(new AuthManager({ type: 'bearer', token: 'catalog-token' }).getAuthorizationHeader()).resolves.toBe(
      'Bearer catalog-token'
    );
  });

  it('should reject empty bearer credentials', () => {
    expect(() => new AuthManager({ type: 'bearer', token: '' })).toThrow(AuthenticationError);
    expect(() => new AuthManager({ type: 'bearer', tokenFile: '' })).toThrow(AuthenticationError);
  });

  it('should read and refresh a file-backed bearer token', async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'backstage-mcp-auth-'));
    const tokenFile = join(temporaryDirectory, 'token');
    await writeFile(tokenFile, 'first-token\n', 'utf8');
    const manager = new AuthManager({ type: 'bearer', tokenFile });

    await expect(manager.getAuthorizationHeader()).resolves.toBe('Bearer first-token');
    await writeFile(tokenFile, 'second-token', 'utf8');
    await expect(manager.getAuthorizationHeader()).resolves.toBe('Bearer second-token');
  });

  it('should reject missing and empty token files without exposing the path', async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'backstage-mcp-auth-'));
    const tokenFile = join(temporaryDirectory, 'token');
    const manager = new AuthManager({ type: 'bearer', tokenFile });

    await expect(manager.getAuthorizationHeader()).rejects.toThrow('Unable to read the Backstage bearer token file');
    await writeFile(tokenFile, ' \n', 'utf8');
    await expect(manager.getAuthorizationHeader()).rejects.toThrow('The Backstage bearer token file is empty');
  });
});
