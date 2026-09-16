/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { readFile } from 'node:fs/promises';

import { BackstageAuthorizationScheme } from '../../shared/constants/backstage-catalog.js';
import { AuthenticationError } from '../../shared/errors/error-handling.js';
import { isNonEmptyString } from '../../shared/validation/guards.js';
import type { IAuthConfig, IFileBearerAuthConfig } from '../../types/index.js';

const TOKEN_FILE_ENCODING = 'utf8';

/**
 * Reports whether authentication uses an externally managed token file.
 * @param config - Backstage bearer authentication configuration.
 * @returns Whether the configuration names a token file.
 */
function isFileBearerAuth(config: Readonly<IAuthConfig>): config is Readonly<IFileBearerAuthConfig> {
  return config.tokenFile !== undefined;
}

/**
 * Supplies the bearer credential used by this external Backstage client.
 *
 * Backstage's supported external-access mechanisms (static tokens and JWKS
 * tokens) are both sent verbatim in the Authorization header. Plugin-to-plugin
 * token issuance is intentionally not emulated by this standalone process.
 */
export class AuthManager {
  private readonly config: Readonly<IAuthConfig>;

  /**
   * Initializes a bearer-token provider.
   * @param config - Validated external Backstage authentication configuration.
   * @throws {AuthenticationError} When the configured token is empty.
   */
  constructor(config: Readonly<IAuthConfig>) {
    const credential = isFileBearerAuth(config) ? config.tokenFile : config.token;
    if (!isNonEmptyString(credential)) {
      throw new AuthenticationError('A non-empty Backstage bearer token is required');
    }
    this.config = config;
  }

  /**
   * Gets the authorization header for a Catalog API request.
   * File-backed tokens are read for every request so an external process can
   * rotate the credential without restarting this server.
   * @returns A bearer authorization header containing the current token.
   * @throws {AuthenticationError} When a token file cannot be read or is empty.
   */
  async getAuthorizationHeader(): Promise<string> {
    const token = isFileBearerAuth(this.config) ? await this.readTokenFile(this.config.tokenFile) : this.config.token;
    return `${BackstageAuthorizationScheme.BEARER} ${token}`;
  }

  /**
   * Reads and validates the current externally managed bearer token.
   * @param tokenFile - Path to the token file.
   * @returns The trimmed, non-empty token.
   * @throws {AuthenticationError} When the file cannot be read or contains no token.
   */
  private async readTokenFile(tokenFile: string): Promise<string> {
    let token: string;
    try {
      token = (await readFile(tokenFile, TOKEN_FILE_ENCODING)).trim();
    } catch {
      throw new AuthenticationError('Unable to read the Backstage bearer token file');
    }
    if (!isNonEmptyString(token)) {
      throw new AuthenticationError('The Backstage bearer token file is empty');
    }
    return token;
  }
}
