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

import { PluginRegistry } from '../../core/plugin-system/plugin.registry.js';
import { CatalogToolsPlugin } from '../../domain/catalog/catalog-tools.plugin.js';

/**
 * Initialize all tool plugins
 * This is the central point for plugin registration and initialization
 * @returns Promise that resolves to the initialized PluginRegistry
 */
export async function initializeToolPlugins(): Promise<PluginRegistry> {
  const pluginRegistry = PluginRegistry.getInstance();

  // Register core catalog tools plugin
  await pluginRegistry.getPluginManager().registerPlugin(new CatalogToolsPlugin());

  // Additional plugins can be registered here in the future
  // await pluginRegistry.getPluginManager().registerPlugin(new OtherPlugin());

  return pluginRegistry;
}
