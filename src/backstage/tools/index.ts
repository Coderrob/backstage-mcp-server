/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import type { ToolDefinition } from '../../mcp/definitions.js';
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
