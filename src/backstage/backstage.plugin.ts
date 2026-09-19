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

import { definePlugin } from '@coderrob/mcp-kernel';

import {
  BACKSTAGE_CATALOG_PLUGIN_NAME,
  BACKSTAGE_CATALOG_PLUGIN_VERSION,
} from '../shared/constants/backstage-catalog.js';
import { queryEntitiesInputSchema } from '../shared/schema.js';
import type { BackstageMcpContext } from '../types/backstage.js';
import { backstageCatalogTools } from './tools/index.js';

export type { BackstageMcpContext } from '../types/backstage.js';

/** Compatibility schema exported for consumers defining get-entities requests. */
export const getEntitiesInputSchema = queryEntitiesInputSchema;

/** Complete Backstage Catalog feature plugin for the generic MCP harness. */
export const backstageCatalogPlugin = definePlugin<BackstageMcpContext>({
  name: BACKSTAGE_CATALOG_PLUGIN_NAME,
  version: BACKSTAGE_CATALOG_PLUGIN_VERSION,
  description: 'Backstage Catalog MCP tools',
  features: backstageCatalogTools,
});
