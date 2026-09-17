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

/** Stable codes for configuration and external-authentication failures. */
export enum ApplicationErrorCode {
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  CONFIGURATION = 'CONFIGURATION_ERROR',
}

/** Base class for application-boundary failures outside the MCP invocation path. */
abstract class ApplicationError extends Error {
  /**
   * Creates an application error with a stable code and safe details.
   * @param code - Stable machine-readable error code.
   * @param message - Human-readable failure description.
   * @param details - Optional safe diagnostic context.
   */
  protected constructor(
    readonly code: Readonly<ApplicationErrorCode>,
    message: string,
    readonly details?: Readonly<Record<string, unknown>>
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Authentication configuration rejected before an upstream request is made. */
export class AuthenticationError extends ApplicationError {
  /**
   * Creates an authentication configuration error.
   * @param message - Human-readable failure description.
   * @param details - Optional safe diagnostic context.
   */
  constructor(message = 'Authentication required', details?: Readonly<Record<string, unknown>>) {
    super(ApplicationErrorCode.AUTHENTICATION, message, details);
  }
}

/** Invalid or incomplete process configuration. */
export class ConfigurationError extends ApplicationError {
  /**
   * Creates a configuration error.
   * @param message - Human-readable failure description.
   * @param details - Optional safe diagnostic context.
   */
  constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super(ApplicationErrorCode.CONFIGURATION, message, details);
  }
}
