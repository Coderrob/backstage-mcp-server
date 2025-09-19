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
import { toolMetadataMap } from '../../decorators/tool.decorator.js';
import { IToolMetadata, IToolMetadataProvider, ToolClass } from '../../types/tools.js';
import { isFunction, isObject } from '../core/guards.js';

/**
 * Metadata provider that uses reflection to retrieve tool metadata.
 * Looks up metadata from the tool decorator registry.
 */
export class ReflectToolMetadataProvider implements IToolMetadataProvider {
  /**
   * Retrieves metadata for a tool class or instance.
   * Accepts either a constructor function or an instance object.
   * @param toolClass - The tool class constructor or instance to get metadata for
   * @returns The tool metadata if found, undefined otherwise
   */
  getMetadata(toolClass: ToolClass | object): IToolMetadata | undefined {
    // Allow callers to pass either a class (constructor) or an instance.
    const key = isFunction(toolClass)
      ? toolClass
      : toolClass != null && isObject(toolClass)
        ? (toolClass as { constructor: unknown }).constructor
        : toolClass;
    return toolMetadataMap.get(key as ToolClass);
  }
}
