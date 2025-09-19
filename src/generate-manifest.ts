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
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import type { ITool, IToolMetadata, IToolRegistrar } from './types/tools.js';
import { logger } from './utils/core/logger.js';
import { DefaultToolFactory } from './utils/tools/tool-factory.js';
import { ToolLoader } from './utils/tools/tool-loader.js';
import { ReflectToolMetadataProvider } from './utils/tools/tool-metadata.js';
import { DefaultToolValidator } from './utils/tools/tool-validator.js';

class MockToolRegistrar implements IToolRegistrar {
  register(_toolClass: ITool, _metadata: IToolMetadata): void {
    // Mock implementation - do nothing for manifest generation
  }
}

export async function generateManifest(): Promise<void> {
  // ESM doesn't provide a __dirname variable - synthesize one from import.meta.url
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const toolLoader = new ToolLoader(
    new DefaultToolFactory(),
    new MockToolRegistrar(),
    new DefaultToolValidator(),
    new ReflectToolMetadataProvider()
  );

  await toolLoader.registerAll();
  await toolLoader.exportManifest(join(__dirname, '..', 'tools-manifest.json'));

  logger.info('Tools manifest generated successfully!');
}

generateManifest().catch((error) => {
  logger.error('Failed to generate manifest:', error);
  process.exit(1);
});
