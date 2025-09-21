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

import { BaseToolPlugin } from '../../core/plugin-system/base-tool.plugin.js';
import { CatalogToolFactory } from '../../core/tool-factory.js';
import { IToolRegistrar } from '../../core/types.js';
import { ToolName } from '../../shared/types/constants.js';
import { addLocationSchema, AddLocationToolImpl } from './add-location.tool.js';
import { getEntitiesSchema, GetEntitiesToolImpl } from './get-entities.tool.js';
import { getEntityByRefSchema, GetEntityByRefToolImpl } from './get-entity-by-ref.tool.js';

/**
 * Catalog Tools Plugin - Manages all catalog-related tools
 * Implements plugin-based architecture for better modularity
 */
export class CatalogToolsPlugin extends BaseToolPlugin {
  readonly name = 'catalog-tools';
  readonly version = '2.0.0';
  readonly description = 'Core Backstage catalog tools with advanced patterns';

  protected async onInitialize(registrar: IToolRegistrar): Promise<void> {
    // Register Add Location Tool
    const addLocationTool = CatalogToolFactory.createCatalogWriteTool()
      .name(ToolName.ADD_LOCATION)
      .description('Add a new location to the Backstage catalog')
      .schema(addLocationSchema)
      .version('2.0.0')
      .tags('catalog', 'location', 'write')
      .withClass(AddLocationToolImpl)
      .build();

    const addLocationMetadata = addLocationTool.getMetadata();
    registrar.registerTool(addLocationTool, addLocationMetadata);

    // Register Get Entity By Ref Tool
    const getEntityByRefTool = CatalogToolFactory.createCatalogReadTool()
      .name(ToolName.GET_ENTITY_BY_REF)
      .description('Get a single entity by its reference')
      .schema(getEntityByRefSchema)
      .version('2.0.0')
      .tags('catalog', 'entity', 'read', 'single')
      .cacheable(true)
      .withClass(GetEntityByRefToolImpl)
      .build();

    const getEntityByRefMetadata = getEntityByRefTool.getMetadata();
    registrar.registerTool(getEntityByRefTool, getEntityByRefMetadata);

    // Register Get Entities Tool
    const getEntitiesTool = CatalogToolFactory.createCatalogReadTool()
      .name(ToolName.GET_ENTITIES)
      .description('Get multiple entities from the catalog with filtering and pagination')
      .schema(getEntitiesSchema)
      .version('2.0.0')
      .tags('catalog', 'entity', 'read', 'query', 'batch')
      .cacheable(true)
      .maxBatchSize(100)
      .withClass(GetEntitiesToolImpl)
      .build();

    const getEntitiesMetadata = getEntitiesTool.getMetadata();
    registrar.registerTool(getEntitiesTool, getEntitiesMetadata);
  }

  protected async onDestroy(): Promise<void> {
    // Cleanup if needed
    console.warn('Catalog tools plugin destroyed');
  }
}
