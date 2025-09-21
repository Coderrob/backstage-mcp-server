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

import { IToolPlugin } from '../types.js';
import { PluginManager } from './plugin.manager.js';

/**
 * Plugin registry for discovering and loading plugins
 * Implements the Service Locator pattern
 */

export class PluginRegistry {
  private static instance: PluginRegistry;
  private pluginManager = new PluginManager();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Get the plugin manager
   */
  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  /**
   * Auto-register plugins from a list
   */
  async autoRegisterPlugins(plugins: IToolPlugin[]): Promise<void> {
    for (const plugin of plugins) {
      try {
        await this.pluginManager.registerPlugin(plugin);
      } catch (error) {
        console.error(`Failed to auto-register plugin '${plugin.name}':`, error);
      }
    }
  }

  /**
   * Shutdown the registry
   */
  async shutdown(): Promise<void> {
    await this.pluginManager.shutdown();
  }
}
