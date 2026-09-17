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

/** Structured, redacted context attached to a log record. */
export type LoggerFields = Readonly<Record<string, unknown>>;

/** Minimal logger contract shared by the MCP kernel and application modules. */
export interface Logger {
  debug(message: string, fields?: LoggerFields): void;
  info(message: string, fields?: LoggerFields): void;
  warn(message: string, fields?: LoggerFields): void;
  error(message: string, fields?: LoggerFields): void;
}

/** Extended logger contract used by compatibility and operational modules. */
export interface OperationalLogger extends Logger {
  fatal(message: string, fields?: LoggerFields): void;
  child(bindings: LoggerFields): OperationalLogger;
  createOperationLogger(operation: string, additionalContext?: LoggerFields): OperationalLogger;
}
