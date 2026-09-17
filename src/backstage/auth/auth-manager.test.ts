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

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { AuthType } from '../../shared/constants/backstage-catalog.js';
import { AuthenticationError } from '../../shared/errors/error-handling.js';
import { AuthManager } from './auth-manager.js';

describe('AuthManager', () => {
  let temporaryDirectory: string | undefined;

  afterEach(async () => {
    if (temporaryDirectory !== undefined) await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('should create a bearer authorization header', async () => {
    await expect(
      new AuthManager({ type: AuthType.BEARER, token: 'catalog-token' }).getAuthorizationHeader()
    ).resolves.toBe('Bearer catalog-token');
  });

  it('should reject empty bearer credentials', () => {
    expect(() => new AuthManager({ type: AuthType.BEARER, token: '' })).toThrow(AuthenticationError);
    expect(() => new AuthManager({ type: AuthType.BEARER, tokenFile: '' })).toThrow(AuthenticationError);
  });

  it('should read and refresh a file-backed bearer token', async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'backstage-mcp-auth-'));
    const tokenFile = join(temporaryDirectory, 'token');
    await writeFile(tokenFile, 'first-token\n', 'utf8');
    const manager = new AuthManager({ type: AuthType.BEARER, tokenFile });

    await expect(manager.getAuthorizationHeader()).resolves.toBe('Bearer first-token');
    await writeFile(tokenFile, 'second-token', 'utf8');
    await expect(manager.getAuthorizationHeader()).resolves.toBe('Bearer second-token');
  });

  it('should reject missing and empty token files without exposing the path', async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'backstage-mcp-auth-'));
    const tokenFile = join(temporaryDirectory, 'token');
    const manager = new AuthManager({ type: AuthType.BEARER, tokenFile });

    await expect(manager.getAuthorizationHeader()).rejects.toThrow('Unable to read the Backstage bearer token file');
    await writeFile(tokenFile, ' \n', 'utf8');
    await expect(manager.getAuthorizationHeader()).rejects.toThrow('The Backstage bearer token file is empty');
  });
});
