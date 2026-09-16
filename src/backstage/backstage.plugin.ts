/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { definePlugin } from '../mcp/definitions.js';
import {
  BACKSTAGE_CATALOG_PLUGIN_NAME,
  BACKSTAGE_CATALOG_PLUGIN_VERSION,
} from '../shared/constants/backstage-catalog.js';
import type { BackstageMcpContext } from '../types/backstage.js';
import { backstageCatalogTools } from './tools/index.js';

export type { BackstageMcpContext } from '../types/backstage.js';
export { queryEntitiesInputSchema as getEntitiesInputSchema } from './tools/shared.js';

/** Complete Backstage Catalog feature plugin for the generic MCP harness. */
export const backstageCatalogPlugin = definePlugin<BackstageMcpContext>({
  name: BACKSTAGE_CATALOG_PLUGIN_NAME,
  version: BACKSTAGE_CATALOG_PLUGIN_VERSION,
  description: 'Backstage Catalog MCP tools',
  features: backstageCatalogTools,
});
