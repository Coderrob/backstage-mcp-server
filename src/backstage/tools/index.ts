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
import { findEntitiesByNameTool } from './find_entities_by_name.tool.js';
import { findUsersByNameTool } from './find_users_by_name.tool.js';
import { getApisByConsumerTool } from './get_apis_by_consumer.tool.js';
import { getApisByProviderTool } from './get_apis_by_provider.tool.js';
import { getChildGroupsByGroupTool } from './get_child_groups_by_group.tool.js';
import { getConsumersByApiTool } from './get_consumers_by_api.tool.js';
import { getDependenciesByEntityTool } from './get_dependencies_by_entity.tool.js';
import { getDependentsByEntityTool } from './get_dependents_by_entity.tool.js';
import { getEntitiesTool } from './get_entities.tool.js';
import { getEntitiesByAnnotationTool } from './get_entities_by_annotation.tool.js';
import { getEntitiesByDomainTool } from './get_entities_by_domain.tool.js';
import { getEntitiesByOwnerTool } from './get_entities_by_owner.tool.js';
import { getEntitiesByQueryTool } from './get_entities_by_query.tool.js';
import { getEntitiesByRefsTool } from './get_entities_by_refs.tool.js';
import { getEntitiesBySystemTool } from './get_entities_by_system.tool.js';
import { getEntityAncestorsTool } from './get_entity_ancestors.tool.js';
import { getEntityByRefTool } from './get_entity_by_ref.tool.js';
import { getEntityFacetsTool } from './get_entity_facets.tool.js';
import { getGroupsByUserTool } from './get_groups_by_user.tool.js';
import { getLocationByEntityTool } from './get_location_by_entity.tool.js';
import { getLocationByRefTool } from './get_location_by_ref.tool.js';
import { getOrphanedEntitiesTool } from './get_orphaned_entities.tool.js';
import { getOwnersByEntityTool } from './get_owners_by_entity.tool.js';
import { getProvidersByApiTool } from './get_providers_by_api.tool.js';
import { getSubdomainsByDomainTool } from './get_subdomains_by_domain.tool.js';
import { getSystemsByDomainTool } from './get_systems_by_domain.tool.js';
import { getUsersByGroupTool } from './get_users_by_group.tool.js';
import { refreshEntityTool } from './refresh_entity.tool.js';
import { removeEntityByUidTool } from './remove_entity_by_uid.tool.js';
import { removeLocationByIdTool } from './remove_location_by_id.tool.js';
import { validateEntityTool } from './validate_entity.tool.js';

/** Complete, deterministic Backstage Catalog MCP tool collection. */
export const backstageCatalogTools: readonly ToolDefinition<BackstageMcpContext>[] = Object.freeze([
  addLocationTool,
  findEntitiesByNameTool,
  findUsersByNameTool,
  getApisByConsumerTool,
  getApisByProviderTool,
  getChildGroupsByGroupTool,
  getConsumersByApiTool,
  getDependenciesByEntityTool,
  getDependentsByEntityTool,
  getEntitiesTool,
  getEntitiesByAnnotationTool,
  getEntitiesByDomainTool,
  getEntitiesByOwnerTool,
  getEntitiesByQueryTool,
  getEntitiesByRefsTool,
  getEntitiesBySystemTool,
  getEntityAncestorsTool,
  getEntityByRefTool,
  getEntityFacetsTool,
  getGroupsByUserTool,
  getLocationByEntityTool,
  getLocationByRefTool,
  getOrphanedEntitiesTool,
  getOwnersByEntityTool,
  getProvidersByApiTool,
  getSubdomainsByDomainTool,
  getSystemsByDomainTool,
  getUsersByGroupTool,
  refreshEntityTool,
  removeEntityByUidTool,
  removeLocationByIdTool,
  validateEntityTool,
]);
