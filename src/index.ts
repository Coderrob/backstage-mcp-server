import { startServer } from './server.js';
import { logger } from './utils/core/logger.js';

(async function main(): Promise<void> {
  await startServer().catch((err) => {
    logger.error('Fatal server startup error', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  });
})();
