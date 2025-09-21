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

import { IToolPlugin, IToolRegistrar } from '../types.js';

/**
 * Abstract base class for tool plugins
 * Provides common functionality and enforces plugin contract
 */

export abstract class BaseToolPlugin implements IToolPlugin {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly description: string;

  private initialized = false;

  /**
   * Initialize the plugin
   */
  async initialize(registrar: IToolRegistrar): Promise<void> {
    if (this.initialized) {
      throw new Error(`Plugin '${this.name}' is already initialized`);
    }

    await this.onInitialize(registrar);
    this.initialized = true;
  }

  /**
   * Destroy the plugin
   */
  async destroy(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.onDestroy();
    this.initialized = false;
  }

  /**
   * Check if plugin is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Abstract method for plugin-specific initialization
   */
  protected abstract onInitialize(registrar: IToolRegistrar): Promise<void>;

  /**
   * Abstract method for plugin-specific cleanup
   */
  protected abstract onDestroy(): Promise<void>;
}
