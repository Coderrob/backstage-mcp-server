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

import type { ToolDefinition } from '@coderrob/mcp-kernel';

import type { BackstageMcpContext } from '../../types/index.js';
import { addLocationTool } from './add_location.tool.js';
import { getEntitiesTool } from './get_entities.tool.js';
import { getEntitiesByQueryTool } from './get_entities_by_query.tool.js';
import { getEntitiesByRefsTool } from './get_entities_by_refs.tool.js';
import { getEntityAncestorsTool } from './get_entity_ancestors.tool.js';
import { getEntityByRefTool } from './get_entity_by_ref.tool.js';
import { getEntityFacetsTool } from './get_entity_facets.tool.js';
import { getLocationByEntityTool } from './get_location_by_entity.tool.js';
import { getLocationByRefTool } from './get_location_by_ref.tool.js';
import { refreshEntityTool } from './refresh_entity.tool.js';
import { removeEntityByUidTool } from './remove_entity_by_uid.tool.js';
import { removeLocationByIdTool } from './remove_location_by_id.tool.js';
import { validateEntityTool } from './validate_entity.tool.js';

/** Complete, deterministic Backstage Catalog MCP tool collection. */
export const backstageCatalogTools: readonly ToolDefinition<BackstageMcpContext>[] = Object.freeze([
  addLocationTool,
  getEntitiesTool,
  getEntitiesByQueryTool,
  getEntitiesByRefsTool,
  getEntityAncestorsTool,
  getEntityByRefTool,
  getEntityFacetsTool,
  getLocationByEntityTool,
  getLocationByRefTool,
  refreshEntityTool,
  removeEntityByUidTool,
  removeLocationByIdTool,
  validateEntityTool,
]);
