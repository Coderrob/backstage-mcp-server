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

import { IEnhancedTool, IToolMetadata, IToolPlugin, IToolRegistrar } from '../types.js';
import { ToolRegistrar } from './tool.registrar.js';

/**
 * Plugin manager for managing tool plugins
 * Implements the Plugin pattern for modular architecture
 */

export class PluginManager {
  private plugins = new Map<string, IToolPlugin>();
  private registrar = new ToolRegistrar();

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: IToolPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }

    try {
      await plugin.initialize(this.registrar);
      this.plugins.set(plugin.name, plugin);
    } catch (error) {
      throw new Error(
        `Failed to initialize plugin '${plugin.name}': ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin '${pluginName}' is not registered`);
    }

    try {
      await plugin.destroy();
      this.plugins.delete(pluginName);
    } catch (error) {
      console.error(`Error destroying plugin '${pluginName}':`, error);
      throw error;
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): IToolPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin by name
   */
  getPlugin(name: string): IToolPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get the tool registrar
   */
  getToolRegistrar(): IToolRegistrar {
    return this.registrar;
  }

  /**
   * Get all tools from all plugins
   */
  getAllTools(): Array<{ tool: IEnhancedTool; metadata: IToolMetadata }> {
    return this.registrar.getRegisteredTools();
  }

  /**
   * Shutdown all plugins
   */
  async shutdown(): Promise<void> {
    const pluginNames = Array.from(this.plugins.keys());

    for (const pluginName of pluginNames) {
      try {
        await this.unregisterPlugin(pluginName);
      } catch (error) {
        console.error(`Error shutting down plugin '${pluginName}':`, error);
      }
    }
  }

  /**
   * Get plugin health status
   */
  getHealthStatus(): Array<{ plugin: string; version: string; healthy: boolean }> {
    return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
      plugin: name,
      version: plugin.version,
      healthy: true, // In a real implementation, you might have health checks
    }));
  }
}
