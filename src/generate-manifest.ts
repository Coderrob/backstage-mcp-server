import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import type { ITool, IToolMetadata, IToolRegistrar } from './types';
import { DefaultToolFactory, DefaultToolValidator, logger, ReflectToolMetadataProvider, ToolLoader } from './utils';

class MockToolRegistrar implements IToolRegistrar {
  register(_toolClass: ITool, _metadata: IToolMetadata): void {
    // Mock implementation - do nothing for manifest generation
  }
}

async function generateManifest(): Promise<void> {
  // ESM doesn't provide a __dirname variable - synthesize one from import.meta.url
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const toolLoader = new ToolLoader(
    join(__dirname, 'tools'),
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
