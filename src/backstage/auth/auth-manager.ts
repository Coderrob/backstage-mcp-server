/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import { AuthenticationError } from '../../shared/errors/error-handling.js';
import { isNonEmptyString } from '../../shared/validation/guards.js';
import type { IAuthConfig } from '../../types/index.js';

/**
 * Supplies the bearer credential used by this external Backstage client.
 *
 * Backstage's supported external-access mechanisms (static tokens and JWKS
 * tokens) are both sent verbatim in the Authorization header. Plugin-to-plugin
 * token issuance is intentionally not emulated by this standalone process.
 */
export class AuthManager {
  private readonly token: string;

  /**
   * Initializes a bearer-token provider.
   * @param config - Validated external Backstage authentication configuration.
   * @throws {AuthenticationError} When the configured token is empty.
   */
  constructor(config: Readonly<IAuthConfig>) {
    if (!isNonEmptyString(config.token)) {
      throw new AuthenticationError('A non-empty Backstage bearer token is required');
    }
    this.token = config.token;
  }

  /**
   * Gets the authorization header for a Catalog API request.
   * @returns A bearer authorization header containing the configured token.
   */
  getAuthorizationHeader(): string {
    return `Bearer ${this.token}`;
  }
}
