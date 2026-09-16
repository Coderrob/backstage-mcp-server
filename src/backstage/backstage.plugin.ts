/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import { definePlugin } from '../mcp/definitions.js';
import type { BackstageMcpContext } from '../types/index.js';
import { backstageCatalogTools } from './tools/index.js';

export { queryEntitiesInputSchema as getEntitiesInputSchema } from './tools/shared.js';
export type { BackstageMcpContext } from '../types/index.js';

/** Complete Backstage Catalog feature plugin for the generic MCP harness. */
export const backstageCatalogPlugin = definePlugin<BackstageMcpContext>({
  name: 'backstage-catalog',
  version: '2.0.0',
  description: 'Backstage Catalog MCP tools',
  features: backstageCatalogTools,
});
